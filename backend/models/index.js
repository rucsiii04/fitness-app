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
import { Equipment } from "./gym/Equipment.js";
import { Class_Type } from "./classes/Class_Type.js";
import { Class_Enrollment } from "./classes/Class_Enrollment.js";
import { Exercise } from "./workouts/Exercise.js";
import { Workout } from "./workouts/Workout.js";
import { Exercise_Equipment } from "./workouts/Exercise_Equipment.js";
import { Gym_Equipment } from "./gym/Gym_Equipment.js";
import { Workout_Exercise } from "./workouts/Workout_Exercise.js";
import { Exercise_Set_Log } from "./workouts/Exercise_Set_Log.js";
import { Workout_Session } from "./workouts/Workout_Session.js";
export const initDatabase = async () => {
  try {
    await db.authenticate();
    console.log("Database connected");

    // await db.sync({ alter: true });
    await db.sync();

    console.log("Models synced");
  } catch (err) {
    console.log("Database error: ", err);
  }
};
