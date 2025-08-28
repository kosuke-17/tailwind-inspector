import React from "react";

interface LegendProps {
  visible: boolean;
}

export const Legend: React.FC<LegendProps> = React.memo(({ visible }) => {
  if (!visible) return null;

  return (
    <div id='ti-legend'>
      表示: 右下ボタンで ON/OFF・モード切替
      <span className='item'>
        <span className='sw pad'></span>Padding
      </span>
      <span className='item'>
        <span className='sw mar'></span>Margin
      </span>
      <span className='item'>
        <span className='sw gap'></span>Gap
      </span>
      <span className='item'>
        <span className='sw out'></span>Element
      </span>
    </div>
  );
});
