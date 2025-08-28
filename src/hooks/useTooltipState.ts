import { useState } from "react";
import { TooltipData } from "../types";

export const useTooltipState = () => {
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return {
    state: {
      mousePosition,
      tooltipData,
      tooltipVisible,
    },
    actions: {
      setMousePosition,
      setTooltipData,
      setTooltipVisible,
    },
  };
};
