import { useState, useEffect, useCallback, useRef } from "react";
import { TooltipData, ElementData, GapSegment } from "../types";
import { 
  toSides, 
  extractTailwindClasses, 
  createToast,
  getSettings,
  saveSetting,
  addSettingsChangeListener,
  calculateGapSegments,
  MAX_ELEMENTS,
  MAX_GAP_SEGMENTS
} from "../utils";
import { useThrottledCallback, useDebouncedCallback } from "./useThrottle";

export const useInspector = () => {
  const [enabled, setEnabled] = useState(false);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [legendVisible, setLegendVisible] = useState(true);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [hoverElement, setHoverElement] = useState<Element | null>(null);
  const [globalElements, setGlobalElements] = useState<ElementData[]>([]);
  const [globalGapSegments, setGlobalGapSegments] = useState<GapSegment[]>([]);

  const rafQueued = useRef(false);
  const globalLayerRef = useRef<HTMLDivElement>(null);

  // 初期設定の読み込み
  useEffect(() => {
    getSettings().then((settings) => {
      setEnabled(settings.enabled);
      setInspectorMode(settings.inspectorMode);
      setLegendVisible(settings.legendVisible);
    });
  }, []);

  // 設定変更の監視
  useEffect(() => {
    const removeListener = addSettingsChangeListener((changes) => {
      if ("enabled" in changes) {
        setEnabled(changes.enabled!);
      }
      if ("inspectorMode" in changes) {
        setInspectorMode(changes.inspectorMode!);
      }
      if ("legendVisible" in changes) {
        setLegendVisible(changes.legendVisible!);
      }
    });

    return removeListener;
  }, []);

  // マウス移動イベント（スロットリング適用）
  const handleMouseMove = useThrottledCallback(
    useCallback(
      (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });

        if (!enabled || inspectorMode) return;
        setTooltipVisible(true);
      },
      [enabled, inspectorMode]
    ),
    16 // 60fps相当
  );

  // マウスオーバーイベント
  const handleMouseOver = useCallback(
    (e: Event) => {
      if (!enabled || inspectorMode) return;

      const el = e.target as HTMLElement;
      if (!el || el.closest("#ti-toggle")) return;

      try {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          setHoverElement(null);
          return;
        }

        const cs = getComputedStyle(el);
        const pad = toSides(cs, "padding");
        const mar = toSides(cs, "margin");

        const classes = extractTailwindClasses(el.className);
        setTooltipData({
          classes,
          fg: cs.color,
          bg: cs.backgroundColor,
          pad,
          mar,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          radius: cs.borderRadius,
        });
        setHoverElement(el);
      } catch {
        setHoverElement(null);
      }
    },
    [enabled, inspectorMode]
  );

  // スクロール・リサイズイベント（デバウンス適用）
  const handleScroll = useDebouncedCallback(
    useCallback(() => {
      if (enabled && inspectorMode) {
        buildGlobalSoon();
      }
      if (enabled && !inspectorMode && mousePosition) {
        const el = document.elementFromPoint(mousePosition.x, mousePosition.y);
        if (el instanceof HTMLElement && !el.closest("#ti-toggle")) {
          // 直接handleMouseOverの処理を実行
          try {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) {
              setHoverElement(null);
              return;
            }

            const cs = getComputedStyle(el);
            const pad = toSides(cs, "padding");
            const mar = toSides(cs, "margin");

            const classes = extractTailwindClasses(el.className);
            setTooltipData({
              classes,
              fg: cs.color,
              bg: cs.backgroundColor,
              pad,
              mar,
              fontSize: cs.fontSize,
              lineHeight: cs.lineHeight,
              radius: cs.borderRadius,
            });
            setHoverElement(el);
          } catch {
            setHoverElement(null);
          }
        }
      }
    }, [enabled, inspectorMode, mousePosition]),
    50 // 50ms デバウンス
  );

  const handleResize = useDebouncedCallback(
    useCallback(() => {
      if (enabled && inspectorMode) {
        buildGlobalSoon();
      }
    }, [enabled, inspectorMode]),
    100 // 100ms デバウンス
  );

  // 全要素モードでの描画
  const buildGlobalSoon = useCallback(() => {
    if (rafQueued.current) return;
    rafQueued.current = true;
    requestAnimationFrame(() => {
      rafQueued.current = false;
      buildGlobal();
    });
  }, []);

  const buildGlobal = useCallback(() => {
    if (!inspectorMode || !enabled) {
      setGlobalElements([]);
      setGlobalGapSegments([]);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const allElements = document.querySelectorAll("body *");
    const elements: ElementData[] = [];
    const gapSegments: GapSegment[] = [];
    let drawn = 0;
    let gapSegs = 0;

    for (const el of allElements) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.closest("#ti-toggle")) continue;
      if (el.id && el.id.startsWith("ti-")) continue;
      if ([...el.classList].some((c) => c.startsWith("ti-"))) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.bottom < 0 || rect.right < 0 || rect.top > vh || rect.left > vw) continue;

      const cs = getComputedStyle(el);
      const pad = toSides(cs, "padding");
      const mar = toSides(cs, "margin");
      const rowGap = parseFloat(cs.rowGap) || 0;
      const columnGap = parseFloat(cs.columnGap) || 0;

      const hasPad = pad.t || pad.r || pad.b || pad.l;
      const hasMar = mar.t || mar.r || mar.b || mar.l;
      const hasGap = rowGap > 0 || columnGap > 0;

      if (hasPad || hasMar || hasGap) {
        elements.push({
          element: el,
          rect,
          padding: pad,
          margin: mar,
          rowGap,
          columnGap,
        });

        // Gap セグメントの計算
        if (hasGap) {
          const newGapSegments = calculateGapSegments(
            el,
            rect,
            rowGap,
            columnGap,
            MAX_GAP_SEGMENTS - gapSegs
          );
          gapSegments.push(...newGapSegments);
          gapSegs += newGapSegments.length;
        }

        drawn++;
        if (drawn >= MAX_ELEMENTS || gapSegs >= MAX_GAP_SEGMENTS) {
          createToast(
            `Elements capped at ${MAX_ELEMENTS}, gap segments capped at ${MAX_GAP_SEGMENTS}`
          );
          break;
        }
      }
    }

    setGlobalElements(elements);
    setGlobalGapSegments(gapSegments);
  }, [inspectorMode, enabled]);

  // イベントリスナーの設定
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, {
      capture: true,
      passive: true,
    });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver, {
        capture: true,
      });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleMouseMove, handleMouseOver, handleScroll, handleResize]);

  // MutationObserver
  useEffect(() => {
    if (!enabled || !inspectorMode) return;

    const mo = new MutationObserver(() => {
      buildGlobalSoon();
    });

    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => mo.disconnect();
  }, [enabled, inspectorMode, buildGlobalSoon]);

  // トグル関数
  const toggleEnabled = useCallback(async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    await saveSetting("enabled", newEnabled);
    createToast(`Tailwind Inspector: ${newEnabled ? "ON" : "OFF"}`);
  }, [enabled]);

  const toggleMode = useCallback(async () => {
    const newMode = !inspectorMode;
    setInspectorMode(newMode);
    await saveSetting("inspectorMode", newMode);
    createToast(`Mode: ${newMode ? "All (全要素)" : "Hover"}`);
  }, [inspectorMode]);

  const toggleLegend = useCallback(async () => {
    const newVisible = !legendVisible;
    setLegendVisible(newVisible);
    await saveSetting("legendVisible", newVisible);
    createToast(`説明: ${newVisible ? "ON" : "OFF"}`);
  }, [legendVisible]);

  return {
    enabled,
    inspectorMode,
    legendVisible,
    tooltipData,
    tooltipVisible,
    mousePosition,
    hoverElement,
    globalElements,
    globalGapSegments,
    globalLayerRef,
    toggleEnabled,
    toggleMode,
    toggleLegend,
  };
};
