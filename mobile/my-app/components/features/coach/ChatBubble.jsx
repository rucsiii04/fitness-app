import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const formatTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Render plain text with **bold** segments parsed inline
function RichText({ text, style }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} style={styles.boldInline}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

function AIBubble({ message }) {
  return (
    <View style={styles.aiWrapper}>
      <View style={styles.aiHeader}>
        <View style={styles.aiIconContainer}>
          <Ionicons name="sparkles" size={11} color={Colors.background} />
        </View>
        <Text style={styles.aiLabel}>KINETIC AI COACH</Text>
      </View>
      <View style={styles.aiBubble}>
        <RichText text={message.content} style={styles.aiText} />
      </View>
    </View>
  );
}

function UserBubble({ message }) {
  return (
    <View style={styles.userWrapper}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{message.content}</Text>
      </View>
      <Text style={styles.timestamp}>{formatTime(message.sent_at)}</Text>
    </View>
  );
}

export function ChatBubble({ message }) {
  if (message.sender === "AI") return <AIBubble message={message} />;
  return <UserBubble message={message} />;
}

const styles = StyleSheet.create({
  // AI bubble
  aiWrapper: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    marginBottom: 4,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  aiIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  aiLabel: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Colors.secondary,
    textTransform: "uppercase",
  },
  aiBubble: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  aiText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  boldInline: {
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
  },

  // User bubble
  userWrapper: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: Colors.primaryContainer,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    fontWeight: "500",
    color: "#3b4a00",
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 2,
  },
});
