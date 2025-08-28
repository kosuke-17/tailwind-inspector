import React from "react";
import { ToggleButtons } from "./components/ToggleButtons";
import { Legend } from "./components/Legend";
import { Tooltip } from "./components/Tooltip";
import { HoverRing } from "./components/HoverRing";
import { useInspector } from "./hooks/useInspector";
import "./styles.css";

export const App: React.FC = () => {
  const {
    enabled,
    inspectorMode,
    legendVisible,
    tooltipData,
    tooltipVisible,
    mousePosition,
    hoverElement,
    globalLayerRef,
    toggleEnabled,
    toggleMode,
    toggleLegend,
  } = useInspector();

  return (
    <>
      {/* トグルボタン群 - 常に表示してUXを改善 */}
      <ToggleButtons
        enabled={enabled}
        inspectorMode={inspectorMode}
        legendVisible={legendVisible}
        onToggleEnabled={toggleEnabled}
        onToggleMode={toggleMode}
        onToggleLegend={toggleLegend}
      />

      {/* Inspector機能がenabledの場合のみ以下を表示 */}
      {enabled && (
        <>
          {/* グローバルレイヤー（全要素モード用） */}
          <div
            ref={globalLayerRef}
            id='ti-global'
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 0,
              height: 0,
              pointerEvents: "none",
              zIndex: 2147483647,
            }}
          />

          {/* レジェンド */}
          <Legend visible={legendVisible} />

          {/* ホバーリング */}
          <HoverRing
            targetElement={hoverElement}
            tooltipData={tooltipData}
            visible={!inspectorMode && hoverElement !== null}
          />

          {/* ツールチップ */}
          <Tooltip
            data={tooltipData}
            position={mousePosition}
            visible={tooltipVisible && !inspectorMode}
          />
        </>
      )}
    </>
  );
};
