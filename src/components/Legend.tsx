import React from "react";

interface LegendProps {
  visible: boolean;
}

export const Legend: React.FC<LegendProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div id='ti-legend'>
      表示: 右下ボタンで ON/OFF・モード切替
      <span className='item'>
        <span
          className='sw pad'
          style={{ backgroundColor: "rgba(120, 200, 80, 0.8)" }}
        ></span>
        Padding (緑)
      </span>
      <span className='item'>
        <span
          className='sw mar'
          style={{ backgroundColor: "rgba(255, 158, 67, 0.8)" }}
        ></span>
        Margin (オレンジ)
      </span>
      <span className='item'>
        <span
          className='sw gap'
          style={{ backgroundColor: "rgba(78, 205, 196, 0.8)" }}
        ></span>
        Gap (青緑)
      </span>
      <span className='item'>
        <span
          className='sw out'
          style={{ backgroundColor: "rgba(166, 172, 180, 0.8)" }}
        ></span>
        Element (グレー)
      </span>
    </div>
  );
};
