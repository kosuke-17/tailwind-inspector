import React, { useMemo } from "react";
import { TooltipData } from "../types";
import { MIN_LABEL_THICKNESS } from "../utils";

interface HoverRingProps {
  targetElement: Element | null;
  tooltipData: TooltipData | null;
  visible: boolean;
}

export const HoverRing: React.FC<HoverRingProps> = React.memo(({
  targetElement,
  tooltipData,
  visible,
}) => {
  // 計算処理をメモ化
  const computedData = useMemo(() => {
    if (!visible || !targetElement || !tooltipData) {
      return null;
    }

    const rect = targetElement.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return null;
    }

    const { pad, mar } = tooltipData;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // 基本のボックス位置
    const box = {
      top: rect.top + scrollY,
      left: rect.left + scrollX,
      width: rect.width,
      height: rect.height,
    };

    return { pad, mar, box };
  }, [visible, targetElement, tooltipData]);

  if (!computedData) {
    return null;
  }

  const { pad, mar, box } = computedData;



  // Element アウトライン
  const elementOutlineStyle = {
    position: "absolute" as const,
    pointerEvents: "none" as const,
    zIndex: 2147483647,
    outline: "1px solid var(--ti-outline)",
    top: `${box.top}px`,
    left: `${box.left}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  };

  // Margin セグメント（上下左右の個別描画）
  const marginSegments = [
    // Top margin
    mar.t > 0 ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      backgroundColor: "var(--ti-margin)",
      top: `${box.top - mar.t}px`,
      left: `${box.left - mar.l}px`,
      width: `${box.width + mar.l + mar.r}px`,
      height: `${mar.t}px`,
      value: mar.t,
    } : null,
    // Right margin
    mar.r > 0 ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      backgroundColor: "var(--ti-margin)",
      top: `${box.top}px`,
      left: `${box.left + box.width}px`,
      width: `${mar.r}px`,
      height: `${box.height}px`,
      value: mar.r,
    } : null,
    // Bottom margin
    mar.b > 0 ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      backgroundColor: "var(--ti-margin)",
      top: `${box.top + box.height}px`,
      left: `${box.left - mar.l}px`,
      width: `${box.width + mar.l + mar.r}px`,
      height: `${mar.b}px`,
      value: mar.b,
    } : null,
    // Left margin
    mar.l > 0 ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      backgroundColor: "var(--ti-margin)",
      top: `${box.top}px`,
      left: `${box.left - mar.l}px`,
      width: `${mar.l}px`,
      height: `${box.height}px`,
      value: mar.l,
    } : null,
  ].filter((segment): segment is NonNullable<typeof segment> => segment !== null);

  // Padding セグメント
  const paddingSegments = [
    // Top padding
    pad.t > 0 ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      backgroundColor: "var(--ti-padding)",
      top: `${box.top}px`,
      left: `${box.left}px`,
      width: `${box.width}px`,
      height: `${pad.t}px`,
      value: pad.t,
    } : null,
    // Right padding
    pad.r > 0 ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      backgroundColor: "var(--ti-padding)",
      top: `${box.top}px`,
      left: `${box.left + box.width - pad.r}px`,
      width: `${pad.r}px`,
      height: `${box.height}px`,
      value: pad.r,
    } : null,
    // Bottom padding
    pad.b > 0 ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      backgroundColor: "var(--ti-padding)",
      top: `${box.top + box.height - pad.b}px`,
      left: `${box.left}px`,
      width: `${box.width}px`,
      height: `${pad.b}px`,
      value: pad.b,
    } : null,
    // Left padding
    pad.l > 0 ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      backgroundColor: "var(--ti-padding)",
      top: `${box.top}px`,
      left: `${box.left}px`,
      width: `${pad.l}px`,
      height: `${box.height}px`,
      value: pad.l,
    } : null,
  ].filter((segment): segment is NonNullable<typeof segment> => segment !== null);

  return (
    <>
      {/* Element outline */}
      <div style={elementOutlineStyle} />

      {/* Margin segments */}
      {marginSegments.map((segment, index) => (
        <div key={`margin-${index}`} style={segment}>
          {/* Margin label */}
          {segment.value >= MIN_LABEL_THICKNESS && (
            <div className="ti-seg-label">
              {`${Math.round(segment.value)}px`}
            </div>
          )}
        </div>
      ))}

      {/* Padding segments */}
      {paddingSegments.map((segment, index) => (
        <div key={`padding-${index}`} style={segment}>
          {/* Padding label */}
          {segment.value >= MIN_LABEL_THICKNESS && (
            <div className="ti-seg-label">
              {`${Math.round(segment.value)}px`}
            </div>
          )}
        </div>
      ))}
    </>
  );
});