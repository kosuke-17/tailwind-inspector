import React from "react";
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
  if (!visible || !targetElement || !tooltipData) return null;

  const rect = targetElement.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;

  const { pad, mar } = tooltipData;
  const box = {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };

  const createSegmentStyle = (
    top: number,
    left: number,
    width: number,
    height: number,
    color: string
  ) => ({
    position: "absolute" as const,
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: color,
    pointerEvents: "none" as const,
    zIndex: 2147483647,
  });

  const createLabel = (
    valuePx: number,
    _top: number,
    _left: number,
    orientation: "h" | "v"
  ) => {
    if (valuePx < MIN_LABEL_THICKNESS) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#fff",
          fontSize: "10px",
          fontWeight: "500",
          textShadow: "0 0 2px rgba(0,0,0,0.8)",
          whiteSpace: "nowrap",
          writingMode: orientation === "v" ? "vertical-lr" : "initial",
        }}
      >
        {Math.round(valuePx)}px
      </div>
    );
  };

  return (
    <>
      {/* Element outline */}
      <div
        style={{
          position: "absolute",
          top: `${box.top}px`,
          left: `${box.left}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
          border: "1px solid var(--ti-outline)",
          pointerEvents: "none",
          zIndex: 2147483647,
        }}
      />

      {/* Margin rings (outer) */}
      {mar.t > 0 && (
        <div
          style={createSegmentStyle(
            box.top - mar.t,
            box.left - mar.l,
            box.width + mar.l + mar.r,
            mar.t,
            "var(--ti-margin)"
          )}
        >
          {createLabel(mar.t, 0, 0, "h")}
        </div>
      )}
      {mar.r > 0 && (
        <div
          style={createSegmentStyle(
            box.top,
            box.left + box.width,
            mar.r,
            box.height,
            "var(--ti-margin)"
          )}
        >
          {createLabel(mar.r, 0, 0, "v")}
        </div>
      )}
      {mar.b > 0 && (
        <div
          style={createSegmentStyle(
            box.top + box.height,
            box.left - mar.l,
            box.width + mar.l + mar.r,
            mar.b,
            "var(--ti-margin)"
          )}
        >
          {createLabel(mar.b, 0, 0, "h")}
        </div>
      )}
      {mar.l > 0 && (
        <div
          style={createSegmentStyle(
            box.top,
            box.left - mar.l,
            mar.l,
            box.height,
            "var(--ti-margin)"
          )}
        >
          {createLabel(mar.l, 0, 0, "v")}
        </div>
      )}

      {/* Padding rings (inner) */}
      {pad.t > 0 && (
        <div
          style={createSegmentStyle(
            box.top,
            box.left,
            box.width,
            pad.t,
            "var(--ti-padding)"
          )}
        >
          {createLabel(pad.t, 0, 0, "h")}
        </div>
      )}
      {pad.r > 0 && (
        <div
          style={createSegmentStyle(
            box.top,
            box.left + box.width - pad.r,
            pad.r,
            box.height,
            "var(--ti-padding)"
          )}
        >
          {createLabel(pad.r, 0, 0, "v")}
        </div>
      )}
      {pad.b > 0 && (
        <div
          style={createSegmentStyle(
            box.top + box.height - pad.b,
            box.left,
            box.width,
            pad.b,
            "var(--ti-padding)"
          )}
        >
          {createLabel(pad.b, 0, 0, "h")}
        </div>
      )}
      {pad.l > 0 && (
        <div
          style={createSegmentStyle(
            box.top,
            box.left,
            pad.l,
            box.height,
            "var(--ti-padding)"
          )}
        >
          {createLabel(pad.l, 0, 0, "v")}
        </div>
      )}
    </>
  );
});