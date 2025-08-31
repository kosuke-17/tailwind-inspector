import React from "react";

interface ToggleButtonsProps {
  enabled: boolean;
  inspectorMode: boolean;
  legendVisible: boolean;
  onToggleEnabled: () => void;
  onToggleMode: () => void;
  onToggleLegend: () => void;
}

export const ToggleButtons: React.FC<ToggleButtonsProps> = React.memo(
  ({
    enabled,
    inspectorMode,
    legendVisible,
    onToggleEnabled,
    onToggleMode,
    onToggleLegend,
  }) => {
    const handleKeyDown =
      (callback: () => void) => (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          callback();
        }
      };

    return (
      <div id='ti-toggle'>
        <button
          className={enabled ? "on" : "off"}
          onClick={onToggleEnabled}
          onKeyDown={handleKeyDown(onToggleEnabled)}
          aria-pressed={enabled}
        >
          {enabled ? "Inspector: ON" : "Inspector: OFF"}
        </button>
        <button
          className={inspectorMode ? "on" : "off"}
          onClick={onToggleMode}
          onKeyDown={handleKeyDown(onToggleMode)}
          aria-pressed={inspectorMode}
        >
          {inspectorMode ? "Mode: All" : "Mode: Hover"}
        </button>
        <button
          className={legendVisible ? "on" : "off"}
          onClick={onToggleLegend}
          onKeyDown={handleKeyDown(onToggleLegend)}
          aria-pressed={legendVisible}
        >
          {legendVisible ? "説明: ON" : "説明: OFF"}
        </button>
        <span className='hint'>Tailwind Inspector By React Output</span>
      </div>
    );
  }
);
