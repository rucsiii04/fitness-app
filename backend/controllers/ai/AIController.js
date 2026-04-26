import {
  Conversation_AI,
  Message,
  Client_Profile,
  Workout_Session,
  Workout,
  Workout_Exercise,
  Exercise,
  User,
} from "../../models/index.js";
import { geminiModel } from "../../config/gemini.js";

const GENERATION_VERBS = [
  "genereaz",
  "creeaz",
  "creaz",
  "fă-mi",
  "fa-mi",
  "fă mi",
  "fa mi",
  "vreau un plan",
  "vreau sa",
  "vreau să",
  "fă-mi",
  "make me",
  "generate",
  "create",
  "build me",
  "give me a",
  "pot avea",
  "poți face",
  "poti face",
];
const GENERATION_NOUNS = [
  "antrenament",
  "workout",
  "plan de antrenament",
  "training plan",
  "program de antrenament",
  "plan de fitness",
  "rutina",
  "rutină",
];

const isWorkoutGenerationRequest = (message) => {
  const lower = message.toLowerCase();
  const hasVerb = GENERATION_VERBS.some((v) => lower.includes(v));
  const hasNoun = GENERATION_NOUNS.some((n) => lower.includes(n));
  return hasVerb && hasNoun;
};

const MODIFICATION_KEYWORDS = [
  "schimbă",
  "schimba",
  "înlocuiește",
  "inlocuieste",
  "înlocuieste",
  "scoate",
  "elimină",
  "elimina",
  "șterge",
  "sterge",
  "adaugă",
  "adauga",
  "adăuga",
  "modifică",
  "modifica",
  "actualizează",
  "actualizeaza",
  "renumește",
  "redenumește",
  "redenumeste",
  "change",
  "replace",
  "swap",
  "remove",
  "delete",
  "add",
  "update",
  "rename",
  "modify",
];

const isWorkoutModificationRequest = (message) => {
  const lower = message.toLowerCase();
  return MODIFICATION_KEYWORDS.some((k) => lower.includes(k));
};

const buildSystemPrompt = (profile, user, recentSessions) => {
  const name = `${user.first_name} ${user.last_name}`;
  const weight = profile?.current_weight
    ? `${profile.current_weight} kg`
    : "unknown";
  const height = profile?.height ? `${profile.height} cm` : "unknown";
  const goal = profile?.main_goal ?? "unknown";
  const activity = profile?.activity_level ?? "unknown";
  const gender = profile?.gender ?? "unknown";
  const restrictions = profile?.medical_restriction ?? "none";

  const sessionLines = recentSessions.length
    ? recentSessions
        .map((s) => {
          const date = new Date(s.started_at).toLocaleDateString();
          const workoutName = s.Workout?.name ?? "Unknown workout";
          return `  - ${date}: ${workoutName}`;
        })
        .join("\n")
    : "  No recent sessions recorded.";

  return `You are a personal fitness assistant inside a gym management app.

Client profile:
- Name: ${name}
- Gender: ${gender}
- Weight: ${weight}
- Height: ${height}
- Main goal: ${goal}
- Activity level: ${activity}
- Medical restrictions: ${restrictions}

Recent workout sessions (last 5):
${sessionLines}

Guidelines:
- Be specific and practical. Tailor every answer to this client's profile.
- If medical restrictions are listed, always respect them.
- Keep responses concise and friendly.
- Do not recommend exercises that conflict with medical restrictions.

STRICT RULES:
- Only answer questions related to fitness, workouts, health, or fitness-related nutrition.
- If the user asks something unrelated (e.g. general recipes, desserts, non-fitness topics), DO NOT answer it.
- Instead, politely refuse and redirect the conversation to fitness topics.
- Never invent information outside the fitness domain.
- If you are unsure, say you are not sure instead of guessing.
- Always respond in the same language as the user's message.
`;
};

const buildWorkoutContextSection = (
  workout,
  workoutExercises,
  availableExercises,
) => {
  const exerciseLines = workoutExercises.length
    ? workoutExercises
        .map(
          (we, i) =>
            `  ${i + 1}. [workout_exercise_id: ${we.workout_exercise_id}] ${we.Exercise?.name ?? "Unknown"} (${we.Exercise?.muscle_group ?? "?"}) — ${we.sets} sets × ${we.reps} reps${we.rest_time ? `, ${we.rest_time}s rest` : ""}${i === workoutExercises.length - 1 ? "  ← LAST EXERCISE" : ""}`,
        )
        .join("\n")
    : "  (no exercises yet)";

  const lastExercise = workoutExercises[workoutExercises.length - 1];
  const lastExerciseHint = lastExercise
    ? `The LAST exercise is "${lastExercise.Exercise?.name ?? "Unknown"}" with workout_exercise_id=${lastExercise.workout_exercise_id}. When the user says "last exercise" or "ultimul exercițiu", they mean this one.`
    : "";

  const libraryLines = availableExercises
    .map(
      (e) => `  [exercise_id: ${e.exercise_id}] ${e.name} (${e.muscle_group})`,
    )
    .join("\n");

  return `
The user has a linked workout plan:
- Name: "${workout.name}"
- Difficulty: ${workout.difficulty_level ?? "not set"}
- Description: ${workout.description ?? "none"}

Current exercises in this plan (use workout_exercise_id when calling tools):
${exerciseLines}

${lastExerciseHint}

Available exercises you can add (use exercise_id when calling tools):
${libraryLines}

TOOL USAGE RULES:

IMPORTANT:
- If the user asks to change, swap, or replace an exercise, you MUST call the function "replace_exercise".
- Do NOT respond with text before calling the function.
- Never explain what to do. Always use the function.

GENERAL RULES:
- To ADD a new exercise: call add_exercise with an exercise_id.
- To REMOVE an exercise: call remove_exercise with its workout_exercise_id.
- To UPDATE sets or reps: call update_exercise with its workout_exercise_id.
- To RENAME the workout: call update_workout.

AFTER TOOL EXECUTION:
- After the function is executed, you MUST respond with a short confirmation message describing what changed.

IDENTIFIERS:
- NEVER say you don't have an identifier.
- Every exercise already has a workout_exercise_id.
- Always use the provided IDs.
`;
};

const WORKOUT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "add_exercise",
        description: "Add an exercise to the user's linked workout plan.",
        parameters: {
          type: "object",
          properties: {
            exercise_id: {
              type: "number",
              description:
                "The exercise_id from the available exercise library.",
            },
            sets: { type: "number", description: "Number of sets (e.g. 3)." },
            reps: {
              type: "string",
              description:
                "Number of reps as a string (e.g. '12', '8-10', 'to failure').",
            },
            rest_time: {
              type: "number",
              description: "Rest time in seconds between sets (default 60).",
            },
          },
          required: ["exercise_id", "sets", "reps"],
        },
      },
      {
        name: "remove_exercise",
        description: "Remove an exercise from the user's linked workout plan.",
        parameters: {
          type: "object",
          properties: {
            workout_exercise_id: {
              type: "number",
              description:
                "The workout_exercise_id from the current plan exercises list.",
            },
          },
          required: ["workout_exercise_id"],
        },
      },
      {
        name: "update_exercise",
        description:
          "Update the sets or reps for an exercise already in the workout plan.",
        parameters: {
          type: "object",
          properties: {
            workout_exercise_id: {
              type: "number",
              description:
                "The workout_exercise_id from the current plan exercises list.",
            },
            sets: { type: "number", description: "New number of sets." },
            reps: {
              type: "string",
              description: "New number of reps as a string.",
            },
          },
          required: ["workout_exercise_id"],
        },
      },
      {
        name: "replace_exercise",
        description:
          "Replace (swap) an existing exercise in the workout with a different one from the library. Use this when the user asks to change, swap, or replace a specific exercise with another.",
        parameters: {
          type: "object",
          properties: {
            workout_exercise_id: {
              type: "number",
              description: "The workout_exercise_id of the exercise to remove.",
            },
            exercise_id: {
              type: "number",
              description:
                "The exercise_id of the new exercise to add in its place.",
            },
            sets: {
              type: "number",
              description: "Number of sets for the new exercise.",
            },
            reps: {
              type: "string",
              description: "Number of reps as a string (e.g. '12', '8-10').",
            },
            rest_time: {
              type: "number",
              description: "Rest time in seconds (default 60).",
            },
          },
          required: ["workout_exercise_id", "exercise_id", "sets", "reps"],
        },
      },
      {
        name: "update_workout",
        description:
          "Update the name, description, or difficulty level of the linked workout plan itself.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "New workout name." },
            description: {
              type: "string",
              description: "New workout description.",
            },
            difficulty_level: {
              type: "string",
              description:
                "New difficulty: 'beginner', 'intermediate', or 'advanced'.",
            },
          },
        },
      },
    ],
  },
];

const executeWorkoutAction = async (name, args, workoutId, userId) => {
  try {
    if (name === "add_exercise") {
      const { exercise_id, sets, reps, rest_time } = args;

      const [workout, exercise] = await Promise.all([
        Workout.findByPk(workoutId),
        Exercise.findByPk(exercise_id),
      ]);

      if (!workout || workout.created_by_user_id !== userId) {
        return {
          success: false,
          error: "Not authorized to modify this workout.",
        };
      }
      if (!exercise) {
        return {
          success: false,
          error: `No exercise found with id ${exercise_id}.`,
        };
      }

      const count = await Workout_Exercise.count({
        where: { workout_id: workoutId },
      });
      await Workout_Exercise.create({
        workout_id: workoutId,
        exercise_id,
        order_index: count,
        sets,
        reps: String(reps),
        rest_time: rest_time ?? 60,
      });

      return {
        success: true,
        message: `Added "${exercise.name}" — ${sets} sets × ${reps} reps.`,
      };
    }

    if (name === "remove_exercise") {
      const { workout_exercise_id } = args;
      const item = await Workout_Exercise.findByPk(workout_exercise_id);

      if (!item) return { success: false, error: "Exercise entry not found." };

      const workout = await Workout.findByPk(item.workout_id);
      if (!workout || workout.created_by_user_id !== userId) {
        return {
          success: false,
          error: "Not authorized to modify this workout.",
        };
      }

      const exercise = await Exercise.findByPk(item.exercise_id);
      await item.destroy();

      return {
        success: true,
        message: `Removed "${exercise?.name ?? "exercise"}" from the workout.`,
      };
    }

    if (name === "replace_exercise") {
      const { workout_exercise_id, exercise_id, sets, reps, rest_time } = args;

      const item = await Workout_Exercise.findByPk(workout_exercise_id);
      if (!item) return { success: false, error: "Exercise entry not found." };

      const workout = await Workout.findByPk(item.workout_id);
      if (!workout || workout.created_by_user_id !== userId) {
        return {
          success: false,
          error: "Not authorized to modify this workout.",
        };
      }

      const [oldExercise, newExercise] = await Promise.all([
        Exercise.findByPk(item.exercise_id),
        Exercise.findByPk(exercise_id),
      ]);
      if (!newExercise)
        return {
          success: false,
          error: `No exercise found with id ${exercise_id}.`,
        };

      const orderIndex = item.order_index;
      await item.destroy();
      await Workout_Exercise.create({
        workout_id: item.workout_id,
        exercise_id,
        order_index: orderIndex,
        sets,
        reps: String(reps),
        rest_time: rest_time ?? 60,
      });

      return {
        success: true,
        message: `Replaced "${oldExercise?.name ?? "exercise"}" with "${newExercise.name}" — ${sets} sets × ${reps} reps.`,
      };
    }

    if (name === "update_exercise") {
      const { workout_exercise_id, sets, reps } = args;
      const item = await Workout_Exercise.findByPk(workout_exercise_id);

      if (!item) return { success: false, error: "Exercise entry not found." };

      const workout = await Workout.findByPk(item.workout_id);
      if (!workout || workout.created_by_user_id !== userId) {
        return {
          success: false,
          error: "Not authorized to modify this workout.",
        };
      }

      const updates = {};
      if (sets !== undefined) updates.sets = sets;
      if (reps !== undefined) updates.reps = String(reps);
      await item.update(updates);

      const exercise = await Exercise.findByPk(item.exercise_id);
      const summary = [
        sets !== undefined ? `${sets} sets` : null,
        reps !== undefined ? `${reps} reps` : null,
      ]
        .filter(Boolean)
        .join(" × ");

      return {
        success: true,
        message: `Updated "${exercise?.name ?? "exercise"}": ${summary}.`,
      };
    }

    if (name === "update_workout") {
      const { name: newName, description, difficulty_level } = args;

      const workout = await Workout.findByPk(workoutId);
      if (!workout || workout.created_by_user_id !== userId) {
        return {
          success: false,
          error: "Not authorized to modify this workout.",
        };
      }

      const updates = {};
      if (newName !== undefined) updates.name = newName;
      if (description !== undefined) updates.description = description;
      if (difficulty_level !== undefined)
        updates.difficulty_level = difficulty_level;

      if (Object.keys(updates).length === 0) {
        return { success: false, error: "No fields provided to update." };
      }

      await workout.update(updates);

      const parts = [
        newName ? `name → "${newName}"` : null,
        description ? `description updated` : null,
        difficulty_level ? `difficulty → ${difficulty_level}` : null,
      ].filter(Boolean);

      return {
        success: true,
        message: `Workout updated: ${parts.join(", ")}.`,
      };
    }

    return { success: false, error: "Unknown function." };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const getClientContext = async (userId) => {
  const [user, profile, recentSessions] = await Promise.all([
    User.findByPk(userId),
    Client_Profile.findOne({ where: { user_id: userId } }),
    Workout_Session.findAll({
      where: { user_id: userId },
      include: [{ model: Workout, attributes: ["name"] }],
      order: [["started_at", "DESC"]],
      limit: 5,
    }),
  ]);
  return { user, profile, recentSessions };
};

const verifyOwnership = async (conversationId, userId) => {
  const conversation = await Conversation_AI.findOne({
    where: { conversation_id: conversationId, client_id: userId },
  });
  return conversation;
};

export const controller = {
  startConversation: async (req, res) => {
    try {
      const now = new Date();
      const conversation = await Conversation_AI.create({
        client_id: req.user.user_id,
        started_at: now,
        last_activity_at: now,
      });
      return res.status(201).json(conversation);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error starting conversation: " + err.message });
    }
  },

  getMyConversations: async (req, res) => {
    try {
      const conversations = await Conversation_AI.findAll({
        where: { client_id: req.user.user_id },
        order: [["last_activity_at", "DESC"]],
      });

      if (conversations.length === 0) return res.status(200).json([]);

      const ids = conversations.map((c) => c.conversation_id);
      const userMessages = await Message.findAll({
        where: { conversation_id: ids, sender: "user" },
        order: [["sent_at", "ASC"]],
        attributes: ["conversation_id", "content"],
      });

      const firstMessageMap = {};
      for (const msg of userMessages) {
        if (!firstMessageMap[msg.conversation_id]) {
          firstMessageMap[msg.conversation_id] = msg.content;
        }
      }

      const result = conversations.map((c) => ({
        ...c.toJSON(),
        preview: firstMessageMap[c.conversation_id] ?? null,
      }));

      return res.status(200).json(result);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error fetching conversations: " + err.message });
    }
  },

  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const conversation = await verifyOwnership(
        conversationId,
        req.user.user_id,
      );
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await Message.findAll({
        where: { conversation_id: conversationId },
        order: [["sent_at", "ASC"]],
      });

      return res.status(200).json({
        messages,
        linked_plan_id: conversation.linked_plan_id ?? null,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error fetching messages: " + err.message });
    }
  },

  sendMessage: async (req, res) => {
    let userMessage;
    try {
      const { conversationId } = req.params;
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const conversation = await verifyOwnership(
        conversationId,
        req.user.user_id,
      );
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const now = new Date();
      userMessage = await Message.create({
        conversation_id: conversationId,
        sender: "user",
        content,
        sent_at: now,
      });

      // Only redirect to plan generation when there's no linked plan yet
      if (!conversation.linked_plan_id && isWorkoutGenerationRequest(content)) {
        const redirect =
          "Folosește butonul ✦ din colțul din dreapta sus pentru a genera un antrenament personalizat. Îți pot răspunde la orice întrebări despre antrenamentele tale după ce le generezi.";
        const aiMessage = await Message.create({
          conversation_id: conversationId,
          sender: "AI",
          content: redirect,
          sent_at: new Date(),
        });
        await conversation.update({ last_activity_at: new Date() });
        return res.status(200).json(aiMessage);
      }

      const { user, profile, recentSessions } = await getClientContext(
        req.user.user_id,
      );
      let systemPrompt = buildSystemPrompt(profile, user, recentSessions);

      // Load workout context and enable tools when a plan is linked
      let tools;
      let toolConfig;
      if (conversation.linked_plan_id) {
        const [workout, workoutExercises, allExercises] = await Promise.all([
          Workout.findByPk(conversation.linked_plan_id),
          Workout_Exercise.findAll({
            where: { workout_id: conversation.linked_plan_id },
            include: [{ model: Exercise }],
            order: [["order_index", "ASC"]],
          }),
          Exercise.findAll({
            where: { is_active: true },
            attributes: ["exercise_id", "name", "muscle_group"],
            order: [["name", "ASC"]],
          }),
        ]);

        if (workout) {
          systemPrompt += buildWorkoutContextSection(
            workout,
            workoutExercises,
            allExercises,
          );
          tools = WORKOUT_TOOLS;

          // Force function calling when the user clearly wants to modify the workout
          if (isWorkoutModificationRequest(content)) {
            toolConfig = {
              functionCallingConfig: { mode: "ANY" },
            };
          }
        }
      }

      const history = await Message.findAll({
        where: { conversation_id: conversationId },
        order: [["sent_at", "ASC"]],
      });

      const geminiHistory = history.slice(0, -1).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const chat = geminiModel.startChat({
        history: geminiHistory,
        systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
        ...(tools && { tools }),
        ...(toolConfig && { toolConfig }),
      });

      let result = await chat.sendMessage(content);
      let response = result.response;

      // Execute function calls until the model returns a text response
      while (response.functionCalls()?.length) {
        const calls = response.functionCalls();
        const functionResponses = await Promise.all(
          calls.map(async (call) => ({
            functionResponse: {
              name: call.name,
              response: await executeWorkoutAction(
                call.name,
                call.args,
                conversation.linked_plan_id,
                req.user.user_id,
              ),
            },
          })),
        );

        result = await chat.sendMessage(functionResponses);
        response = result.response;
      }

      const aiText = response.text();
      const aiMessage = await Message.create({
        conversation_id: conversationId,
        sender: "AI",
        content: aiText,
        sent_at: new Date(),
      });

      await conversation.update({ last_activity_at: new Date() });
      return res.status(200).json(aiMessage);
    } catch (err) {
      if (userMessage) await userMessage.destroy().catch(() => {});
      return res
        .status(500)
        .json({ message: "Error sending message: " + err.message });
    }
  },

  deleteConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const conversation = await verifyOwnership(
        conversationId,
        req.user.user_id,
      );
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // The linked workout (linked_plan_id) is intentionally left intact.
      await Message.destroy({ where: { conversation_id: conversationId } });
      await conversation.destroy();

      return res.status(200).json({ message: "Conversation deleted" });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error deleting conversation: " + err.message });
    }
  },

  generatePlan: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { preferences } = req.body;
      const conversation = await verifyOwnership(
        conversationId,
        req.user.user_id,
      );
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const { user, profile, recentSessions } = await getClientContext(
        req.user.user_id,
      );

      const recentMessages = await Message.findAll({
        where: { conversation_id: conversationId },
        order: [["sent_at", "DESC"]],
        limit: 10,
      });

      const conversationContext = recentMessages
        .reverse()
        .map(
          (m) =>
            `${m.sender === "user" ? "Client" : "Assistant"}: ${m.content}`,
        )
        .join("\n");

      const preferencesSection = preferences?.trim()
        ? `\nClient's additional preferences for this plan:\n${preferences}\n`
        : "";

      const exercises = await Exercise.findAll({
        where: { is_active: true },
        attributes: [
          "exercise_id",
          "name",
          "muscle_group",
          "equipment_required",
        ],
      });

      const exerciseLibrary = exercises.map((e) => ({
        id: e.exercise_id,
        name: e.name,
        muscle_group: e.muscle_group,
        equipment: e.equipment_required ?? "none",
      }));

      const validIds = new Set(exercises.map((e) => e.exercise_id));
      const systemPrompt = buildSystemPrompt(profile, user, recentSessions);

      const planPrompt = `${systemPrompt}

Recent conversation with the client:
${conversationContext}
${preferencesSection}
You are now generating a personalized workout plan based on the above conversation and client profile.

Available exercises (use ONLY these, and ONLY their exact IDs):
${JSON.stringify(exerciseLibrary, null, 2)}

Return ONLY a valid JSON object with NO explanation, NO markdown, NO backticks. Exactly this shape:
{
  "name": "workout name",
  "description": "short description",
  "difficulty_level": "beginner|intermediate|advanced",
  "exercises": [
    { "exercise_id": 1, "sets": 3, "reps": "12", "rest_time": 60, "notes": "optional tip" }
  ]
}

Rules:
- Choose 4 to 8 exercises appropriate for the client's goal and level.
- Only use exercise_id values from the list above.
- reps is a string (e.g. "12", "8-10", "to failure").
- rest_time is in seconds.
- Respect any medical restrictions.
- Respect any preferences or restrictions the client mentioned in the conversation above.
- If the client provided additional preferences above, prioritize them.`;

      const result = await geminiModel.generateContent(planPrompt);
      const raw = result.response.text();
      const cleaned = raw.replace(/```json|```/g, "").trim();

      let plan;
      try {
        plan = JSON.parse(cleaned);
      } catch {
        return res
          .status(500)
          .json({ message: "AI returned invalid JSON. Try again." });
      }

      const validExercises = (plan.exercises ?? []).filter((e) =>
        validIds.has(e.exercise_id),
      );
      if (validExercises.length === 0) {
        return res
          .status(500)
          .json({ message: "AI returned no valid exercises. Try again." });
      }

      const workout = await Workout.create({
        name: plan.name,
        description: plan.description,
        difficulty_level: plan.difficulty_level,
        source: "ai",
        created_by_user_id: req.user.user_id,
        assigned_to_user_id: req.user.user_id,
        is_public: false,
      });

      await Promise.all(
        validExercises.map((e, index) =>
          Workout_Exercise.create({
            workout_id: workout.workout_id,
            exercise_id: e.exercise_id,
            order_index: index,
            sets: e.sets,
            reps: String(e.reps),
            rest_time: e.rest_time,
            notes: e.notes ?? null,
          }),
        ),
      );

      await conversation.update({
        linked_plan_id: workout.workout_id,
        last_activity_at: new Date(),
      });

      await Message.create({
        conversation_id: conversationId,
        sender: "AI",
        content: `I've generated a workout plan for you: **${plan.name}**. ${plan.description} It includes ${validExercises.length} exercises tailored to your profile.`,
        sent_at: new Date(),
      });

      return res.status(201).json(workout);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error generating plan: " + err.message });
    }
  },
};
