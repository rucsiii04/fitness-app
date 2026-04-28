import { useLocalSearchParams } from "expo-router";
import ClassSessionScreen from "@/components/features/trainer/ClassSessionScreen";

export default function ClassSessionRoute() {
  const { id, name, start, end } = useLocalSearchParams();
  return (
    <ClassSessionScreen
      sessionId={id}
      sessionName={name ?? "Clasă"}
      startDatetime={start}
      endDatetime={end}
    />
  );
}
