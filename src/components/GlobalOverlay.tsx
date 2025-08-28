import React, { useMemo } from "react";
import { Sides } from "../types";
import { MIN_LABEL_THICKNESS } from "../utils";

interface ElementData {
  element: Element;
  rect: DOMRect;
  padding: Sides;
  margin: Sides;
  rowGap: number;
  columnGap: number;
}

interface GapSegment {
  top: number;
  left: number;
  width: number;
  height: number;
  value: number;
  orientation: "h" | "v";
}

interface GlobalOverlayProps {
  elements: ElementData[];
  gapSegments: GapSegment[];
}

export const GlobalOverlay: React.FC<GlobalOverlayProps> = React.memo(({ 
  elements, 
  gapSegments 
}) => {
  // セグメントのスタイル計算をメモ化
  const segments = useMemo(() => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const allSegments: Array<{
      style: React.CSSProperties;
      label?: string;
      type: 'margin' | 'padding' | 'gap';
    }> = [];

    // Margin/Padding セグメント
    elements.forEach((elementData) => {
      const { rect, padding, margin } = elementData;
      const top = rect.top + scrollY;
      const left = rect.left + scrollX;
      const width = rect.width;
      const height = rect.height;

      // Margin セグメント
      if (margin.t > 0) {
        allSegments.push({
          type: 'margin',
          style: {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2147483647,
            backgroundColor: 'var(--ti-margin)',
            top: `${top - margin.t}px`,
            left: `${left - margin.l}px`,
            width: `${width + margin.l + margin.r}px`,
            height: `${margin.t}px`,
          },
          label: margin.t >= MIN_LABEL_THICKNESS ? `${Math.round(margin.t)}px` : undefined,
        });
      }
      if (margin.r > 0) {
        allSegments.push({
          type: 'margin',
          style: {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2147483647,
            backgroundColor: 'var(--ti-margin)',
            top: `${top}px`,
            left: `${left + width}px`,
            width: `${margin.r}px`,
            height: `${height}px`,
          },
          label: margin.r >= MIN_LABEL_THICKNESS ? `${Math.round(margin.r)}px` : undefined,
        });
      }
      if (margin.b > 0) {
        allSegments.push({
          type: 'margin',
          style: {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2147483647,
            backgroundColor: 'var(--ti-margin)',
            top: `${top + height}px`,
            left: `${left - margin.l}px`,
            width: `${width + margin.l + margin.r}px`,
            height: `${margin.b}px`,
          },
          label: margin.b >= MIN_LABEL_THICKNESS ? `${Math.round(margin.b)}px` : undefined,
        });
      }
      if (margin.l > 0) {
        allSegments.push({
          type: 'margin',
          style: {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2147483647,
            backgroundColor: 'var(--ti-margin)',
            top: `${top}px`,
            left: `${left - margin.l}px`,
            width: `${margin.l}px`,
            height: `${height}px`,
          },
          label: margin.l >= MIN_LABEL_THICKNESS ? `${Math.round(margin.l)}px` : undefined,
        });
      }

      // Padding セグメント
      if (padding.t > 0) {
        allSegments.push({
          type: 'padding',
          style: {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2147483647,
            backgroundColor: 'var(--ti-padding)',
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${padding.t}px`,
          },
          label: padding.t >= MIN_LABEL_THICKNESS ? `${Math.round(padding.t)}px` : undefined,
        });
      }
      if (padding.r > 0) {
        allSegments.push({
          type: 'padding',
          style: {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2147483647,
            backgroundColor: 'var(--ti-padding)',
            top: `${top}px`,
            left: `${left + width - padding.r}px`,
            width: `${padding.r}px`,
            height: `${height}px`,
          },
          label: padding.r >= MIN_LABEL_THICKNESS ? `${Math.round(padding.r)}px` : undefined,
        });
      }
      if (padding.b > 0) {
        allSegments.push({
          type: 'padding',
          style: {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2147483647,
            backgroundColor: 'var(--ti-padding)',
            top: `${top + height - padding.b}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${padding.b}px`,
          },
          label: padding.b >= MIN_LABEL_THICKNESS ? `${Math.round(padding.b)}px` : undefined,
        });
      }
      if (padding.l > 0) {
        allSegments.push({
          type: 'padding',
          style: {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2147483647,
            backgroundColor: 'var(--ti-padding)',
            top: `${top}px`,
            left: `${left}px`,
            width: `${padding.l}px`,
            height: `${height}px`,
          },
          label: padding.l >= MIN_LABEL_THICKNESS ? `${Math.round(padding.l)}px` : undefined,
        });
      }
    });

    // Gap セグメント
    gapSegments.forEach((gap) => {
      allSegments.push({
        type: 'gap',
        style: {
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: 2147483647,
          backgroundColor: 'var(--ti-gap)',
          top: `${gap.top}px`,
          left: `${gap.left}px`,
          width: `${gap.width}px`,
          height: `${gap.height}px`,
        },
        label: gap.value >= MIN_LABEL_THICKNESS ? `${Math.round(gap.value)}px` : undefined,
      });
    });

    return allSegments;
  }, [elements, gapSegments]);

  return (
    <>
      {segments.map((segment, index) => (
        <div key={index} style={segment.style}>
          {segment.label && (
            <div className={`ti-seg-label${segment.type === 'gap' && 
              (segment.style.width as number) < (segment.style.height as number) ? ' v' : ''}`}>
              {segment.label}
            </div>
          )}
        </div>
      ))}
    </>
  );
});