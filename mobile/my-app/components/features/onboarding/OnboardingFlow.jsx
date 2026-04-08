import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { GoalStep } from "./GoalStep";
import { PhysicalStep } from "./PhysicalStep";
import { ActivityStep } from "./ActivityStep";
import { MedicalStep } from "./MedicalStep";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

export default function OnboardingFlow() {
  const { token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    main_goal: null,
    gender: null,
    height: null,
    current_weight: null,
    activity_level: null,
    medical_restriction: "",
    restrictions: [],
    no_restrictions: false,
  });

  const updateData = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        main_goal: formData.main_goal,
        gender: formData.gender,
        height: Number(formData.height),
        current_weight: Number(formData.current_weight),
        activity_level: formData.activity_level,
        medical_restriction: formData.no_restrictions
          ? null
          : [...formData.restrictions, formData.medical_restriction]
              .filter(Boolean)
              .join(", ") || null,
      };

      const res = await fetch(`${API_BASE}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Profile creation failed:", data);
        return;
      }

      router.replace("/(tabs)/home");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1)
    return (
      <GoalStep
        data={formData}
        onChange={updateData}
        onNext={() => setStep(2)}
      />
    );
  if (step === 2)
    return (
      <PhysicalStep
        data={formData}
        onChange={updateData}
        onNext={() => setStep(3)}
      />
    );
  if (step === 3)
    return (
      <ActivityStep
        data={formData}
        onChange={updateData}
        onNext={() => setStep(4)}
      />
    );
  if (step === 4)
    return (
      <MedicalStep
        data={formData}
        onChange={updateData}
        onSubmit={handleSubmit}
        loading={loading}
      />
    );
}
