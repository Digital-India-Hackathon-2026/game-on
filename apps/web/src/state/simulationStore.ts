import { create } from "zustand";

export type SimulationMode =
  | null
  | "dyslexia"
  | "adhd"
  | "astigmatism"
  | "low-vision"
  | "colorblind"
  | "cognitive-overload";

export type ColorblindType = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

export interface SimulationState {
  activeSimulation: SimulationMode;
  colorblindType: ColorblindType;
  adhdFocusRecovery: boolean;
  cognitiveFixed: boolean;
  
  setSimulation: (mode: SimulationMode) => void;
  setColorblindType: (type: ColorblindType) => void;
  setAdhdFocusRecovery: (active: boolean) => void;
  setCognitiveFixed: (active: boolean) => void;
  resetAll: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  activeSimulation: null,
  colorblindType: "protanopia",
  adhdFocusRecovery: false,
  cognitiveFixed: false,

  setSimulation: (mode) => set({
    activeSimulation: mode,
    adhdFocusRecovery: false,
    cognitiveFixed: false,
  }),
  setColorblindType: (type) => set({ colorblindType: type }),
  setAdhdFocusRecovery: (active) => set({ adhdFocusRecovery: active }),
  setCognitiveFixed: (active) => set({ cognitiveFixed: active }),
  resetAll: () => set({
    activeSimulation: null,
    adhdFocusRecovery: false,
    cognitiveFixed: false,
  })
}));