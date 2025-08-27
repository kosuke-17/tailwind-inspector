import React from "react";
import { TooltipData } from "../types";
import { toHex, escapeHTML } from "../utils";

interface TooltipProps {
  data: TooltipData | null;
  position: { x: number; y: number } | null;
  visible: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  data,
  position,
  visible,
}) => {
  if (!visible || !data || !position) return null;

  const fgHex = toHex(data.fg);
  const bgHex = toHex(data.bg);

  return (
    <div
      id='ti-tooltip'
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className='row'>
        <strong>Tailwind</strong>: {escapeHTML(data.classes || "(なし)")}
      </div>
      <div className='row'>
        <span className='chip' style={{ background: data.fg }}></span> Text:{" "}
        {fgHex}
      </div>
      <div className='row'>
        <span
          className='chip'
          style={{
            background: data.bg,
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        ></span>{" "}
        BG: {bgHex}
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
};
