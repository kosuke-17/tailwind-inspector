import { useState, useEffect } from "react";

export interface InspectorState {
  enabled: boolean;
  inspectorMode: boolean;
  legendVisible: boolean;
}

const getItem = (key: string) => {
  return localStorage.getItem(key) === "true";
};
const setItem = (key: string, value: boolean) => {
  localStorage.setItem(key, String(value));
};

export const useInspectorState = () => {
  const [enabled, setEnabled] = useState(() => getItem("ti-enabled"));
  const [inspectorMode, setInspectorMode] = useState(() =>
    getItem("ti-inspector")
  );
  const [legendVisible, setLegendVisible] = useState(() =>
    getItem("ti-legend-visible")
  );

  // 状態をlocalStorageに保存
  useEffect(() => {
    setItem("ti-enabled", enabled);
  }, [enabled]);

  useEffect(() => {
    setItem("ti-inspector", inspectorMode);
  }, [inspectorMode]);

  useEffect(() => {
    setItem("ti-legend-visible", legendVisible);
  }, [legendVisible]);

  return {
    state: {
      enabled,
      inspectorMode,
      legendVisible,
    },
    actions: {
      setEnabled,
      setInspectorMode,
      setLegendVisible,
    },
  };
};
