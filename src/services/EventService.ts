import { TooltipData } from "../types";
import { toSides, extractTailwindClasses, debounce } from "../utils";

export interface IEventService {
  handleMouseMove(
    e: MouseEvent,
    onPositionChange: (position: { x: number; y: number }) => void
  ): void;
  handleMouseOver(
    e: Event,
    onTooltipChange: (data: TooltipData | null) => void
  ): void;
  handleScroll(
    enabled: boolean,
    inspectorMode: boolean,
    mousePosition: { x: number; y: number } | null,
    onTooltipChange: (data: TooltipData | null) => void,
    onRebuild: () => void
  ): void;
  handleResize(
    enabled: boolean,
    inspectorMode: boolean,
    onRebuild: () => void
  ): void;
}

export class EventService implements IEventService {
  handleMouseMove(
    e: MouseEvent,
    onPositionChange: (position: { x: number; y: number }) => void
  ): void {
    onPositionChange({ x: e.clientX, y: e.clientY });
  }

  handleMouseOver(
    e: Event,
    onTooltipChange: (data: TooltipData | null) => void,
    onHoverElementChange: (element: Element | null) => void
  ): void {
    const el = e.target as HTMLElement;
    if (!el || el.closest("#ti-toggle")) return;

    try {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        onHoverElementChange(null);
        return;
      }

      const cs = getComputedStyle(el);
      const pad = toSides(cs, "padding");
      const mar = toSides(cs, "margin");

      const classes = extractTailwindClasses(el.className);
      onTooltipChange({
        classes,
        fg: cs.color,
        bg: cs.backgroundColor,
        pad,
        mar,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        radius: cs.borderRadius,
      });
      onHoverElementChange(el);
    } catch {
      onHoverElementChange(null);
    }
  }

  handleScroll(
    enabled: boolean,
    inspectorMode: boolean,
    mousePosition: { x: number; y: number } | null,
    onTooltipChange: (data: TooltipData | null) => void,
    onHoverElementChange: (element: Element | null) => void,
    onRebuild: () => void
  ): void {
    if (enabled && inspectorMode) {
      onRebuild();
    }

    if (enabled && !inspectorMode && mousePosition) {
      const el = document.elementFromPoint(mousePosition.x, mousePosition.y);
      if (el instanceof HTMLElement && !el.closest("#ti-toggle")) {
        try {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            onHoverElementChange(null);
            return;
          }

          const cs = getComputedStyle(el);
          const pad = toSides(cs, "padding");
          const mar = toSides(cs, "margin");

          const classes = extractTailwindClasses(el.className);
          onTooltipChange({
            classes,
            fg: cs.color,
            bg: cs.backgroundColor,
            pad,
            mar,
            fontSize: cs.fontSize,
            lineHeight: cs.lineHeight,
            radius: cs.borderRadius,
          });
          onHoverElementChange(el);
        } catch {
          onHoverElementChange(null);
        }
      }
    }
  }

  createDebouncedResize(
    enabled: boolean,
    inspectorMode: boolean,
    onRebuild: () => void
  ): () => void {
    return debounce(() => {
      if (enabled && inspectorMode) {
        onRebuild();
      }
    }, 100);
  }
}
