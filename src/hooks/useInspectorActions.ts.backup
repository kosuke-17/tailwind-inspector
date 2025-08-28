import { useCallback } from "react";
import { createToast } from "../utils";
import { InspectorState } from "./useInspectorState";

export const useInspectorActions = (
  state: InspectorState,
  actions: {
    setEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
    setInspectorMode: (value: boolean | ((prev: boolean) => boolean)) => void;
    setLegendVisible: (value: boolean | ((prev: boolean) => boolean)) => void;
  }
) => {
  const toggleEnabled = useCallback(() => {
    actions.setEnabled((prev) => !prev);
    createToast(`Tailwind Inspector: ${!state.enabled ? "ON" : "OFF"}`);
  }, [state.enabled, actions]);

  const toggleMode = useCallback(() => {
    actions.setInspectorMode((prev) => !prev);
    createToast(`Mode: ${!state.inspectorMode ? "All (全要素)" : "Hover"}`);
  }, [state.inspectorMode, actions]);

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
