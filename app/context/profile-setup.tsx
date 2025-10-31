"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

export type GeneratedImage = {
  url: string; // data URL or public URL
  id: string; // attempt id
};

type ProfileSetupState = {
  step: 1 | 2 | 3;
  selfieUrl?: string;
  promptOriginal: string;
  promptImproved?: string;
  images: GeneratedImage[]; // up to 3
  selectedImage?: GeneratedImage;
  selfieVideoUrl?: string;
  animationUrl?: string; // mock result
  fromSetup?: boolean; // used to hint Upload page
};

type ProfileSetupContextShape = ProfileSetupState & {
  reset: () => void;
  setStep: (s: ProfileSetupState["step"]) => void;
  setSelfieUrl: (u?: string) => void;
  setPromptOriginal: (t: string) => void;
  setPromptImproved: (t?: string) => void;
  pushImage: (img: GeneratedImage) => void;
  selectImage: (img?: GeneratedImage) => void;
  setSelfieVideoUrl: (u?: string) => void;
  setAnimationUrl: (u?: string) => void;
  setFromSetup: (b: boolean) => void;
};

const ProfileSetupContext = createContext<ProfileSetupContextShape | null>(null);

export function ProfileSetupProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProfileSetupState>({ step: 1, promptOriginal: "", images: [] });

  const api: ProfileSetupContextShape = useMemo(
    () => ({
      ...state,
      reset: () => setState({ step: 1, promptOriginal: "", images: [] }),
      setStep: (s) => setState((p) => ({ ...p, step: s })),
      setSelfieUrl: (u) => setState((p) => ({ ...p, selfieUrl: u })),
      setPromptOriginal: (t) => setState((p) => ({ ...p, promptOriginal: t })),
      setPromptImproved: (t) => setState((p) => ({ ...p, promptImproved: t })),
      pushImage: (img) => setState((p) => ({ ...p, images: [...p.images.slice(-2), img] })),
      selectImage: (img) => setState((p) => ({ ...p, selectedImage: img })),
      setSelfieVideoUrl: (u) => setState((p) => ({ ...p, selfieVideoUrl: u })),
      setAnimationUrl: (u) => setState((p) => ({ ...p, animationUrl: u })),
      setFromSetup: (b) => setState((p) => ({ ...p, fromSetup: b })),
    }),
    [state]
  );

  return <ProfileSetupContext.Provider value={api}>{children}</ProfileSetupContext.Provider>;
}

export function useProfileSetup() {
  const ctx = useContext(ProfileSetupContext);
  if (!ctx) throw new Error("useProfileSetup must be used within ProfileSetupProvider");
  return ctx;
}

