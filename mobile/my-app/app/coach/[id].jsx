import { useLocalSearchParams } from "expo-router";
import CoachScreen from "@/components/features/aiCoach/CoachScreen";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  return <CoachScreen conversationId={id === "new" ? null : Number(id)} />;
}
