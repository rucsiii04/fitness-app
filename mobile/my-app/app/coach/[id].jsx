import { useLocalSearchParams } from "expo-router";
import CoachScreen from "@/components/features/coach/CoachScreen";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  return <CoachScreen conversationId={Number(id)} />;
}
