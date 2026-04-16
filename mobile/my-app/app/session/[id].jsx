import { useLocalSearchParams } from "expo-router";
import WorkoutSessionScreen from "@/components/features/session/WorkoutSessionScreen";
import FreestyleSessionScreen from "@/components/features/session/FreestyleSessionScreen";

export default function SessionRoute() {
  const { id, workoutId } = useLocalSearchParams();

  if (!workoutId) {
    return <FreestyleSessionScreen sessionId={id} />;
  }

  return <WorkoutSessionScreen resumeSessionId={id} resumeWorkoutId={workoutId} />;
}
