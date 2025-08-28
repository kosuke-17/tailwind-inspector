import { useState, useEffect } from "react";

export interface InspectorState {
  enabled: boolean;
  inspectorMode: boolean;
  legendVisible: boolean;
}

const getItem = (key: string, defaultValue: boolean = false) => {
  const item = localStorage.getItem(key);
  if (item === null) return defaultValue;
  return item === "true";
};
const setItem = (key: string, value: boolean) => {
  localStorage.setItem(key, String(value));
};

export const useInspectorState = () => {
  const [enabled, setEnabled] = useState(() => getItem("ti-enabled", true)); // デフォルトをtrueに
  const [inspectorMode, setInspectorMode] = useState(() =>
    getItem("ti-inspector", false)
  );
  const [legendVisible, setLegendVisible] = useState(
    () => getItem("ti-legend-visible", true) // デフォルトをtrueに
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
