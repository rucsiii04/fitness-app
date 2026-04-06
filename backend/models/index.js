import { db } from "../config/db.js";
import { User } from "./users/User.js";
import { QR_Code } from "./gym/QR_Code.js";
import { Reset_Token } from "./users/Reset_Token.js";
import { Conversation_AI } from "./ai/Conversation_AI.js";
import { Message } from "./ai/Messages.js";
import { Gym_Attendance } from "./gym/Gym_Attendance.js";
import { Gym } from "./gym/Gym.js";
import { Client_Profile } from "./users/Client_Profile.js";
import { Membership } from "./membership/Membership.js";
import { Class_Session } from "./classes/Class_Session.js";
import { Membership_Type } from "./membership/Membership_Type.js";
import { Class_Type } from "./classes/Class_Type.js";
import { Class_Enrollment } from "./classes/Class_Enrollment.js";
import { Exercise } from "./workouts/Exercise.js";
import { Workout } from "./workouts/Workout.js";
import { Workout_Exercise } from "./workouts/Workout_Exercise.js";
import { Workout_Session } from "./workouts/Workout_Session.js";
import { Trainer_Assignment } from "./users/Trainer_Assignment.js";
import { Trainer_Profile } from "./users/Trainer_Profile.js";
import { Session_Exercise_Log } from "./workouts/Session_Exercise_Log.js";
//User

User.hasOne(Client_Profile, { foreignKey: "user_id" });
Client_Profile.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });

User.hasMany(Reset_Token, { foreignKey: "user_id" });
Reset_Token.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });

User.hasMany(QR_Code, { foreignKey: "user_id" });
QR_Code.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Gym_Attendance, { foreignKey: "user_id" });
Gym_Attendance.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Membership, { foreignKey: "client_id" });
Membership.belongsTo(User, { foreignKey: "client_id" });

User.belongsToMany(User, {
  through: Trainer_Assignment,
  as: "Clients",
  foreignKey: "trainer_id",
  otherKey: "client_id",
});

User.hasMany(Workout, {
  foreignKey: "assigned_to_user_id",
  as: "AssignedWorkouts",
});

Workout.belongsTo(User, {
  foreignKey: "assigned_to_user_id",
  as: "AssignedUser",
});
User.hasMany(Workout, {
  foreignKey: "created_by_user_id",
  as: "CreatedWorkouts",
});

Workout.belongsTo(User, {
  foreignKey: "created_by_user_id",
  as: "Creator",
});
User.hasOne(Trainer_Profile, { foreignKey: "user_id" });
Trainer_Profile.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });

User.belongsToMany(User, {
  through: Trainer_Assignment,
  as: "Trainers",
  foreignKey: "client_id",
  otherKey: "trainer_id",
});
Trainer_Assignment.belongsTo(User, {
  as: "Trainer",
  foreignKey: "trainer_id",
});
Trainer_Assignment.belongsTo(User, {
  as: "Client",
  foreignKey: "client_id",
});

//Gym
Gym.hasMany(Gym_Attendance, { foreignKey: "gym_id" });
Gym_Attendance.belongsTo(Gym, { foreignKey: "gym_id" });

User.hasMany(Gym, { foreignKey: "admin_user_id", as: "ManagedGyms" });
Gym.belongsTo(User, { foreignKey: "admin_user_id", as: "Admin" });

//membership
Membership_Type.hasMany(Membership, {
  foreignKey: "membership_type_id",
});
Membership.belongsTo(Membership_Type, {
  foreignKey: "membership_type_id",
});

//classes
Class_Type.hasMany(Class_Session, {
  foreignKey: "class_type_id",
});
Class_Session.belongsTo(Class_Type, {
  foreignKey: "class_type_id",
});

Gym.hasMany(Class_Type, { foreignKey: "gym_id" });
Class_Type.belongsTo(Gym, { foreignKey: "gym_id" });

Gym.hasMany(User, { foreignKey: "gym_id", as: "Members" });
User.belongsTo(Gym, { foreignKey: "gym_id", as: "Gym" });

Gym.hasMany(Class_Session, { foreignKey: "gym_id" });
Class_Session.belongsTo(Gym, { foreignKey: "gym_id" });

User.hasMany(Class_Session, {
  foreignKey: "trainer_id",
  as: "TrainerSessions",
});
Class_Session.belongsTo(User, {
  foreignKey: "trainer_id",
  as: "Trainer",
});

Class_Session.hasMany(Class_Enrollment, { foreignKey: "session_id" });
Class_Enrollment.belongsTo(Class_Session, { foreignKey: "session_id" });

User.hasMany(Class_Enrollment, {
  foreignKey: "client_id",
  as: "Enrollments",
});
Class_Enrollment.belongsTo(User, {
  foreignKey: "client_id",
  as: "Client",
});

//ai
User.hasMany(Conversation_AI, { foreignKey: "client_id" });
Conversation_AI.belongsTo(User, { foreignKey: "client_id" });

Conversation_AI.hasMany(Message, {
  foreignKey: "conversation_id",
});
Message.belongsTo(Conversation_AI, {
  foreignKey: "conversation_id",
});

Conversation_AI.belongsTo(Workout, {
  foreignKey: "linked_plan_id",
});

//workout
Workout.hasMany(Workout_Exercise, {
  foreignKey: "workout_id",
  onDelete: "CASCADE",
});
Workout_Exercise.belongsTo(Workout, {
  foreignKey: "workout_id",
});

Exercise.hasMany(Workout_Exercise, {
  foreignKey: "exercise_id",
});
Workout_Exercise.belongsTo(Exercise, {
  foreignKey: "exercise_id",
});

User.hasMany(Workout_Session, { foreignKey: "user_id" });
Workout_Session.belongsTo(User, { foreignKey: "user_id" });

Workout.hasMany(Workout_Session, { foreignKey: "workout_id" });
Workout_Session.belongsTo(Workout, { foreignKey: "workout_id" });

Gym.hasMany(Membership_Type, { foreignKey: "gym_id" });
Membership_Type.belongsTo(Gym, { foreignKey: "gym_id" });

Workout_Session.hasMany(Session_Exercise_Log, {
  foreignKey: "session_id",
  onDelete: "CASCADE",
});
Session_Exercise_Log.belongsTo(Workout_Session, { foreignKey: "session_id" });

Exercise.hasMany(Session_Exercise_Log, { foreignKey: "exercise_id" });
Session_Exercise_Log.belongsTo(Exercise, { foreignKey: "exercise_id" });

export const initDatabase = async () => {
  try {
    await db.authenticate();
    console.log("Database connected");
  } catch (err) {
    console.log("Database error: ", err);
  }
};
export {
  User,
  Reset_Token,
  Client_Profile,
  Gym,
  Membership,
  Membership_Type,
  Class_Session,
  Class_Type,
  Class_Enrollment,
  QR_Code,
  Gym_Attendance,
  Conversation_AI,
  Message,
  Workout,
  Workout_Exercise,
  Workout_Session,
  Exercise,
  Trainer_Assignment,
  Trainer_Profile,
  Session_Exercise_Log,
};
