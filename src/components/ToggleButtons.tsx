import React from "react";

interface ToggleButtonsProps {
  enabled: boolean;
  inspectorMode: boolean;
  legendVisible: boolean;
  onToggleEnabled: () => void;
  onToggleMode: () => void;
  onToggleLegend: () => void;
}

export const ToggleButtons: React.FC<ToggleButtonsProps> = ({
  enabled,
  inspectorMode,
  legendVisible,
  onToggleEnabled,
  onToggleMode,
  onToggleLegend,
}) => {
  return (
    <div id='ti-toggle'>
      <button
        className={enabled ? "on" : "off"}
        onClick={onToggleEnabled}
        aria-pressed={enabled}
      >
        {enabled ? "Inspector: ON" : "Inspector: OFF"}
      </button>
      <button
        className={inspectorMode ? "on" : "off"}
        onClick={onToggleMode}
        aria-pressed={inspectorMode}
      >
        {inspectorMode ? "Mode: All" : "Mode: Hover"}
      </button>
      <button
        className={legendVisible ? "on" : "off"}
        onClick={onToggleLegend}
        aria-pressed={legendVisible}
      >
        {legendVisible ? "説明: ON" : "説明: OFF"}
      </button>
      <span className='hint'>Tailwind Inspector By React Output</span>
    </div>
  );
};
