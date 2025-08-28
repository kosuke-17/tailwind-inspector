import React, { useMemo } from "react";
import { Sides } from "../types";

interface SideLabelsProps {
  bounds: DOMRect;
  padding: Sides;
  margin: Sides;
  minThickness: number;
}

export const SideLabels: React.FC<SideLabelsProps> = React.memo(({
  bounds,
  padding,
  margin,
  minThickness,
}) => {
  // ラベル計算をメモ化
  const labels = useMemo(() => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const box = {
      top: bounds.top + scrollY,
      left: bounds.left + scrollX,
      width: bounds.width,
      height: bounds.height,
    };

    // Padding labels
    const paddingLabels = [
    // Top padding
    padding.t >= minThickness ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      color: "var(--ti-padding-text)",
      fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "2px 4px",
      borderRadius: "2px",
      top: `${box.top - 16}px`,
      left: `${box.left + box.width / 2 - 12}px`,
      text: `${Math.round(padding.t)}px`,
    } : null,
    // Right padding
    padding.r >= minThickness ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      color: "var(--ti-padding-text)",
      fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "2px 4px",
      borderRadius: "2px",
      top: `${box.top + box.height / 2 - 8}px`,
      left: `${box.left + box.width + 4}px`,
      text: `${Math.round(padding.r)}px`,
    } : null,
    // Bottom padding
    padding.b >= minThickness ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      color: "var(--ti-padding-text)",
      fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "2px 4px",
      borderRadius: "2px",
      top: `${box.top + box.height + 4}px`,
      left: `${box.left + box.width / 2 - 12}px`,
      text: `${Math.round(padding.b)}px`,
    } : null,
    // Left padding
    padding.l >= minThickness ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      color: "var(--ti-padding-text)",
      fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "2px 4px",
      borderRadius: "2px",
      top: `${box.top + box.height / 2 - 8}px`,
      left: `${box.left - 28}px`,
      text: `${Math.round(padding.l)}px`,
    } : null,
  ].filter((label): label is NonNullable<typeof label> => label !== null);

  // Margin labels
  const marginLabels = [
    // Top margin
    margin.t >= minThickness ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      color: "var(--ti-margin-text)",
      fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "2px 4px",
      borderRadius: "2px",
      top: `${box.top - margin.t - 18}px`,
      left: `${box.left + box.width / 2 - 12}px`,
      text: `${Math.round(margin.t)}px`,
    } : null,
    // Right margin
    margin.r >= minThickness ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      color: "var(--ti-margin-text)",
      fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "2px 4px",
      borderRadius: "2px",
      top: `${box.top + box.height / 2 - 8}px`,
      left: `${box.left + box.width + margin.r + 28}px`,
      text: `${Math.round(margin.r)}px`,
    } : null,
    // Bottom margin
    margin.b >= minThickness ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      color: "var(--ti-margin-text)",
      fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "2px 4px",
      borderRadius: "2px",
      top: `${box.top + box.height + margin.b + 10}px`,
      left: `${box.left + box.width / 2 - 12}px`,
      text: `${Math.round(margin.b)}px`,
    } : null,
    // Left margin
    margin.l >= minThickness ? {
      position: "absolute" as const,
      pointerEvents: "none" as const,
      zIndex: 2147483647,
      color: "var(--ti-margin-text)",
      fontSize: "11px",
      fontWeight: "bold",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "2px 4px",
      borderRadius: "2px",
      top: `${box.top + box.height / 2 - 8}px`,
      left: `${box.left - margin.l - 40}px`,
      text: `${Math.round(margin.l)}px`,
    } : null,
  ].filter((label): label is NonNullable<typeof label> => label !== null);

    return { paddingLabels, marginLabels };
  }, [bounds, padding, margin, minThickness]);

  return (
    <>
      {/* Padding labels */}
      {labels.paddingLabels.map((label, index) => (
        <div key={`padding-label-${index}`} style={label}>
          {label.text}
        </div>
      ))}

      {/* Margin labels */}
      {labels.marginLabels.map((label, index) => (
        <div key={`margin-label-${index}`} style={label}>
          {label.text}
        </div>
      ))}
    </>
  );
});