import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { chatService } from "@/services/chatService";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { PlanFormModal } from "./PlanFormModal";

const WELCOME_MESSAGE = {
  message_id: "__welcome__",
  sender: "AI",
  content:
    "Hey! I'm your personal AI coach. I can help you plan workouts, answer fitness questions, and create personalized training programs tailored to your goals. What would you like to work on today?",
  sent_at: new Date().toISOString(),
};

function PlanGeneratedCard({ item, onView }) {
  return (
    <View style={styles.planCard}>
      <View style={styles.planCardHeader}>
        <View style={styles.planCardIcon}>
          <Ionicons name="sparkles" size={14} color={Colors.background} />
        </View>
        <Text style={styles.planCardLabel}>PLAN GENERATED</Text>
      </View>
      <Text style={styles.planCardName}>{item.workoutName}</Text>
      <Text style={styles.planCardSub}>
        {item.workoutDescription ?? "Tailored to your profile and goals."}
      </Text>
      <TouchableOpacity
        style={styles.planCardButton}
        onPress={onView}
        activeOpacity={0.85}
      >
        <Text style={styles.planCardButtonText}>View in Workouts</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.background} />
      </TouchableOpacity>
    </View>
  );
}

export default function CoachScreen({ conversationId }) {
  const { token } = useAuth();
  const router = useRouter();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [linkedPlanId, setLinkedPlanId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  useEffect(() => {
    if (!token || !conversationId) return;
    loadMessages();
  }, [token, conversationId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { messages: msgs, linked_plan_id } =
        await chatService.getMessagesWithMeta(token, conversationId);
      setLinkedPlanId(linked_plan_id);
      if (msgs.length > 0) {
        setMessages(msgs);
        setShowWelcome(false);
      } else {
        setMessages([]);
        setShowWelcome(true);
      }
    } catch (err) {
      console.error("Load messages error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = useCallback(
    async (text) => {
      if (!conversationId || sending) return;
      setShowWelcome(false);

      const tempId = `temp_${Date.now()}`;
      const tempUserMsg = {
        message_id: tempId,
        sender: "user",
        content: text,
        sent_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
      setSending(true);

      try {
        const aiMsg = await chatService.sendMessage(token, conversationId, text);
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        console.error("Send error:", err.message);
        setMessages((prev) => prev.filter((m) => m.message_id !== tempId));
        Alert.alert("Error", "Failed to send message. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [conversationId, token, sending]
  );

  const handleGeneratePlan = useCallback(
    async (preferences = "") => {
      if (!conversationId || generatingPlan || sending) return;
      setShowFormModal(false);
      setGeneratingPlan(true);

      try {
        const workout = await chatService.generatePlan(token, conversationId, preferences);
        const { messages: msgs } = await chatService.getMessagesWithMeta(token, conversationId);
        setLinkedPlanId(workout.workout_id);
        setMessages([
          ...(Array.isArray(msgs) ? msgs : []),
          {
            message_id: `plan_${workout.workout_id}`,
            sender: "__plan__",
            workoutName: workout.name,
            workoutDescription: workout.description,
            workoutId: workout.workout_id,
            sent_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error("Generate plan error:", err.message);
        Alert.alert(
          "Could Not Generate Plan",
          "Please chat with the coach a bit more so I can understand your goals, then try again."
        );
      } finally {
        setGeneratingPlan(false);
      }
    },
    [conversationId, token, generatingPlan, sending]
  );

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const displayMessages = showWelcome
    ? [WELCOME_MESSAGE, ...messages]
    : messages;

  const renderItem = ({ item }) => {
    if (item.sender === "__plan__") {
      return (
        <PlanGeneratedCard
          item={item}
          onView={() => router.replace("/(tabs)/workouts")}
        />
      );
    }
    return <ChatBubble message={item} />;
  };

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.centeredFlex}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={12} color={Colors.background} />
            </View>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              {messages.find((m) => m.sender === "user")?.content ?? "Conversație nouă"}
            </Text>
          </View>

          {linkedPlanId ? (
            <TouchableOpacity
              style={styles.viewPlanBtn}
              onPress={() => router.replace("/(tabs)/workouts")}
              activeOpacity={0.85}
            >
              <Ionicons name="barbell-outline" size={14} color={Colors.primary} />
              <Text style={styles.viewPlanBtnText}>Vezi planul</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.generateBtn, (generatingPlan || sending) && styles.generateBtnDisabled]}
              onPress={() => setShowFormModal(true)}
              disabled={generatingPlan || sending}
              activeOpacity={0.85}
            >
              {generatingPlan ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Ionicons name="sparkles" size={16} color={Colors.background} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={(item) => String(item.message_id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={
              <>
                {sending && <TypingIndicator />}
                <View style={{ height: 16 }} />
              </>
            }
          />

          <View style={styles.inputBar}>
            <ChatInput onSend={handleSend} disabled={sending || generatingPlan} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <PlanFormModal
        visible={showFormModal}
        onClose={() => setShowFormModal(false)}
        onGenerate={handleGeneratePlan}
        loading={generatingPlan}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  centeredFlex: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  headerCenter: {
    flex: 1,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  generateBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  viewPlanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primaryDimAlpha,
    backgroundColor: "rgba(209,255,0,0.06)",
  },
  viewPlanBtnText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    flexGrow: 1,
  },

  planCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primaryDimAlpha,
    gap: 8,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planCardIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  planCardLabel: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  planCardName: {
    fontSize: 18,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  planCardSub: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  planCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  planCardButtonText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.background,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  inputBar: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 100,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.background,
  },
});
