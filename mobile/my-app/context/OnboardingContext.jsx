import React, { createContext, useContext, useState } from "react";

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [formData, setFormData] = useState({
    main_goal: null,
    gender: null,
    height: "",
    current_weight: "",
    activity_level: null,
    medical_restriction: "",
    restrictions: [],
    no_restrictions: false,
  });

  const updateData = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const resetData = () => {
    setFormData({
      main_goal: null,
      gender: null,
      height: "",
      current_weight: "",
      activity_level: null,
      medical_restriction: "",
      restrictions: [],
      no_restrictions: false,
    });
  };

  return (
    <OnboardingContext.Provider value={{ formData, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}