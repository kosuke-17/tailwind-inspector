import React, { useMemo } from "react";
import { TooltipData } from "../types";
import { toHex, escapeHTML } from "../utils";

interface TooltipProps {
  data: TooltipData | null;
  position: { x: number; y: number } | null;
  visible: boolean;
}

export const Tooltip: React.FC<TooltipProps> = React.memo(({
  data,
  position,
  visible,
}) => {
  if (!visible || !data || !position) return null;

  // 重い計算をメモ化
  const computedColors = useMemo(() => ({
    fgHex: toHex(data.fg),
    bgHex: toHex(data.bg),
  }), [data.fg, data.bg]);

  const escapedClasses = useMemo(() => 
    escapeHTML(data.classes || "(なし)"), 
    [data.classes]
  );

  return (
    <div
      id='ti-tooltip'
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className='row'>
        <strong>Tailwind</strong>: {escapedClasses}
      </div>
      <div className='row'>
        <span className='chip' style={{ background: data.fg }}></span> Text:{" "}
        {computedColors.fgHex}
      </div>
      <div className='row'>
        <span
          className='chip'
          style={{
            background: data.bg,
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        ></span>{" "}
        BG: {computedColors.bgHex}
      </div>
      <div className='row'>
        Padding: {data.pad.t}/{data.pad.r}/{data.pad.b}/{data.pad.l}px
      </div>
      <div className='row'>
        Margin: {data.mar.t}/{data.mar.r}/{data.mar.b}/{data.mar.l}px
      </div>
      <div className='row'>
        Font: {data.fontSize} Line: {data.lineHeight} Radius: {data.radius}
      </div>
    </div>
  );
});
