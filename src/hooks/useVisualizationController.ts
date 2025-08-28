import { useRef, useCallback } from "react";
import { IVisualizationService } from "../services/VisualizationService";

export const useVisualizationController = (
  visualizationService: IVisualizationService
) => {
  const rafQueued = useRef(false);
  const globalLayerRef = useRef<HTMLDivElement>(null);

  const buildGlobalSoon = useCallback(() => {
    if (rafQueued.current) return;
    rafQueued.current = true;
    requestAnimationFrame(() => {
      rafQueued.current = false;
      buildGlobal();
    });
  }, []);

  const buildGlobal = useCallback(() => {
    if (!globalLayerRef.current) return;
    visualizationService.renderAllElements(globalLayerRef.current);
  }, [visualizationService]);

  return {
    globalLayerRef,
    buildGlobalSoon,
    buildGlobal,
  };
};
