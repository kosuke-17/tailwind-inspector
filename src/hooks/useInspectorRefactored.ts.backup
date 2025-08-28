import { useEffect } from "react";
import { useInspectorState } from "./useInspectorState";
import { useTooltipState } from "./useTooltipState";
import { useVisualizationController } from "./useVisualizationController";
import { useInspectorActions } from "./useInspectorActions";
import {
  VisualizationService,
  IVisualizationService,
} from "../services/VisualizationService";
import { EventService, IEventService } from "../services/EventService";
import { DOMService, IDOMService } from "../services/DOMService";

interface InspectorDependencies {
  visualizationService?: IVisualizationService;
  eventService?: IEventService;
  domService?: IDOMService;
}

export const useInspectorRefactored = (
  dependencies: InspectorDependencies = {}
) => {
  // Dependency Injection with defaults
  const visualizationService =
    dependencies.visualizationService || new VisualizationService();
  const eventService = dependencies.eventService || new EventService();
  const domService = dependencies.domService || new DOMService();

  // 状態管理フック
  const { state: inspectorState, actions: inspectorActions } =
    useInspectorState();
  const { state: tooltipState, actions: tooltipActions } = useTooltipState();

  // 可視化コントローラー
  const { globalLayerRef, buildGlobalSoon } =
    useVisualizationController(visualizationService);

  // アクション管理
  const { toggleEnabled, toggleMode, toggleLegend } = useInspectorActions(
    inspectorState,
    inspectorActions
  );

  // イベントハンドラー設定
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      eventService.handleMouseMove(e, tooltipActions.setMousePosition);

      if (!inspectorState.enabled || inspectorState.inspectorMode) return;
      tooltipActions.setTooltipVisible(true);
    };

    const handleMouseOver = (e: Event) => {
      if (!inspectorState.enabled || inspectorState.inspectorMode) return;
      eventService.handleMouseOver(
        e, 
        tooltipActions.setTooltipData, 
        tooltipActions.setHoverElement
      );
    };

    const handleScroll = () => {
      eventService.handleScroll(
        inspectorState.enabled,
        inspectorState.inspectorMode,
        tooltipState.mousePosition,
        tooltipActions.setTooltipData,
        tooltipActions.setHoverElement,
        buildGlobalSoon
      );
    };

    const handleResize = eventService.createDebouncedResize(
      inspectorState.enabled,
      inspectorState.inspectorMode,
      buildGlobalSoon
    );

    const cleanup = domService.setupEventListeners({
      onMouseMove: handleMouseMove,
      onMouseOver: handleMouseOver,
      onScroll: handleScroll,
      onResize: handleResize,
    });

    return cleanup;
  }, [
    inspectorState.enabled,
    inspectorState.inspectorMode,
    tooltipState.mousePosition,
    eventService,
    domService,
    tooltipActions,
    buildGlobalSoon,
  ]);

  // MutationObserver設定
  useEffect(() => {
    if (!inspectorState.enabled || !inspectorState.inspectorMode) return;

    const cleanup = domService.setupMutationObserver(buildGlobalSoon);
    return cleanup;
  }, [
    inspectorState.enabled,
    inspectorState.inspectorMode,
    domService,
    buildGlobalSoon,
  ]);

  return {
    enabled: inspectorState.enabled,
    inspectorMode: inspectorState.inspectorMode,
    legendVisible: inspectorState.legendVisible,
    tooltipData: tooltipState.tooltipData,
    tooltipVisible: tooltipState.tooltipVisible,
    mousePosition: tooltipState.mousePosition,
    hoverElement: tooltipState.hoverElement,
    globalLayerRef,
    toggleEnabled,
    toggleMode,
    toggleLegend,
  };
};
