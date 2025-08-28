import React from "react";
import { ToggleButtons } from "./components/ToggleButtons";
import { Legend } from "./components/Legend";
import { Tooltip } from "./components/Tooltip";
import { HoverRing } from "./components/HoverRing";
import { SideLabels } from "./components/SideLabels";
import { GlobalOverlay } from "./components/GlobalOverlay";
import { useInspector } from "./hooks/useInspector";
import { MIN_LABEL_THICKNESS } from "./utils";
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
    globalElements,
    globalGapSegments,
    globalLayerRef,
    toggleEnabled,
    toggleMode,
    toggleLegend,
  } = useInspector();

  if (!enabled) return null;

  return (
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
      >
        {/* All モード：全要素オーバーレイ */}
        {inspectorMode && (
          <GlobalOverlay 
            elements={globalElements}
            gapSegments={globalGapSegments}
          />
        )}
      </div>

      {/* レジェンド */}
      <Legend visible={legendVisible} />

      {/* ツールチップ */}
      <Tooltip
        data={tooltipData}
        position={mousePosition}
        visible={tooltipVisible && !inspectorMode}
      />

      {/* ホバーリング（Hover モード用） */}
      <HoverRing
        targetElement={hoverElement}
        tooltipData={tooltipData}
        visible={!inspectorMode && hoverElement !== null}
      />

      {/* サイドラベル（Hover モード用） */}
      {!inspectorMode && hoverElement && tooltipData && (
        <SideLabels
          bounds={hoverElement.getBoundingClientRect()}
          padding={tooltipData.pad}
          margin={tooltipData.mar}
          minThickness={MIN_LABEL_THICKNESS}
        />
      )}

      {/* トグルボタン群 */}
      <ToggleButtons
        enabled={enabled}
        inspectorMode={inspectorMode}
        legendVisible={legendVisible}
        onToggleEnabled={toggleEnabled}
        onToggleMode={toggleMode}
        onToggleLegend={toggleLegend}
      />
    </>
  );
};
