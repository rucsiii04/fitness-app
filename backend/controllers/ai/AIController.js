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
- Do not recommend exercises that conflict with medical restrictions.`;
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
        .send("Error starting conversation: " + err.message);
    }
  },

  getMyConversations: async (req, res) => {
    try {
      const conversations = await Conversation_AI.findAll({
        where: { client_id: req.user.user_id },
        order: [["last_activity_at", "DESC"]],
      });

      return res.status(200).json(conversations);
    } catch (err) {
      return res
        .status(500)
        .send("Error fetching conversations: " + err.message);
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
        return res.status(404).send("Conversation not found");
      }

      const messages = await Message.findAll({
        where: { conversation_id: conversationId },
        order: [["sent_at", "ASC"]],
      });

      return res.status(200).json(messages);
    } catch (err) {
      return res.status(500).send("Error fetching messages: " + err.message);
    }
  },

  sendMessage: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).send("Message content is required");
      }

      const conversation = await verifyOwnership(
        conversationId,
        req.user.user_id,
      );
      if (!conversation) {
        return res.status(404).send("Conversation not found");
      }

      const now = new Date();

      await Message.create({
        conversation_id: conversationId,
        sender: "user",
        content,
        sent_at: now,
      });

      const { user, profile, recentSessions } = await getClientContext(
        req.user.user_id,
      );
      const systemPrompt = buildSystemPrompt(profile, user, recentSessions);

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
        systemInstruction: {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      });

      const result = await chat.sendMessage(content);
      const aiResponse = result.response.text();

      const aiMessage = await Message.create({
        conversation_id: conversationId,
        sender: "AI",
        content: aiResponse,
        sent_at: new Date(),
      });

      await conversation.update({ last_activity_at: new Date() });

      return res.status(200).json(aiMessage);
    } catch (err) {
      return res.status(500).send("Error sending message: " + err.message);
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
        return res.status(404).send("Conversation not found");
      }

      const { user, profile, recentSessions } = await getClientContext(
        req.user.user_id,
      );

      // Fetch recent conversation history
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
        return res.status(500).send("AI returned invalid JSON. Try again.");
      }

      const validExercises = (plan.exercises ?? []).filter((e) =>
        validIds.has(e.exercise_id),
      );

      if (validExercises.length === 0) {
        return res
          .status(500)
          .send("AI returned no valid exercises. Try again.");
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
      return res.status(500).send("Error generating plan: " + err.message);
    }
  },
};
