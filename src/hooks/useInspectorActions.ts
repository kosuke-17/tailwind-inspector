import { useCallback } from "react";
import { createToast } from "../utils";
import { InspectorState } from "./useInspectorState";

export const useInspectorActions = (
  state: InspectorState,
  actions: {
    setEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
    setInspectorMode: (value: boolean | ((prev: boolean) => boolean)) => void;
    setLegendVisible: (value: boolean | ((prev: boolean) => boolean)) => void;
  },
  buildGlobalSoon: () => void
) => {
  const toggleEnabled = useCallback(() => {
    actions.setEnabled((prev) => !prev);
    createToast(`Tailwind Inspector: ${!state.enabled ? "ON" : "OFF"}`);
  }, [state.enabled, actions]);

  const toggleMode = useCallback(() => {
    const newMode = !state.inspectorMode;
    actions.setInspectorMode(newMode);
    createToast(`Mode: ${newMode ? "All (全要素)" : "Hover"}`);

    // Allモードに切り替えた場合、即座に描画を開始
    if (newMode) {
      setTimeout(() => buildGlobalSoon(), 0);
    }
  }, [state.inspectorMode, actions, buildGlobalSoon]);

  const toggleLegend = useCallback(() => {
    actions.setLegendVisible((prev) => !prev);
    createToast(`説明: ${!state.legendVisible ? "ON" : "OFF"}`);
  }, [state.legendVisible, actions]);

  return {
    toggleEnabled,
    toggleMode,
    toggleLegend,
  };
};
