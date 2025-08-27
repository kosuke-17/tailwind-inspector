import { useState, useEffect, useCallback, useRef } from "react";
import { TooltipData } from "../types";
import { toSides, extractTailwindClasses, createToast } from "../utils";

export const useInspector = () => {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem("ti-enabled") === "true"
  );
  const [inspectorMode, setInspectorMode] = useState(
    () => localStorage.getItem("ti-inspector") === "true"
  );
  const [legendVisible, setLegendVisible] = useState(
    () => localStorage.getItem("ti-legend-visible") !== "false"
  );
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const rafQueued = useRef(false);
  const globalLayerRef = useRef<HTMLDivElement>(null);

  // 状態をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("ti-enabled", String(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem("ti-inspector", String(inspectorMode));
  }, [inspectorMode]);

  useEffect(() => {
    localStorage.setItem("ti-legend-visible", String(legendVisible));
  }, [legendVisible]);

  // マウス移動イベント
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      if (!enabled || inspectorMode) return;
      setTooltipVisible(true);
    },
    [enabled, inspectorMode]
  );

  // マウスオーバーイベント
  const handleMouseOver = useCallback(
    (e: Event) => {
      if (!enabled || inspectorMode) return;

      const el = e.target as HTMLElement;
      if (!el || el.closest("#ti-toggle")) return;

      try {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

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
      } catch {}
    },
    [enabled, inspectorMode]
  );

  // スクロール・リサイズイベント
  const handleScroll = useCallback(() => {
    if (enabled && inspectorMode) {
      buildGlobalSoon();
    }
    if (enabled && !inspectorMode && mousePosition) {
      const el = document.elementFromPoint(mousePosition.x, mousePosition.y);
      if (el instanceof HTMLElement && !el.closest("#ti-toggle")) {
        // 直接handleMouseOverの処理を実行
        try {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return;

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
        } catch {}
      }
    }
  }, [enabled, inspectorMode, mousePosition]);

  const handleResize = useCallback(() => {
    if (enabled && inspectorMode) {
      buildGlobalSoon();
    }
  }, [enabled, inspectorMode]);

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
    if (!globalLayerRef.current) return;

    globalLayerRef.current.innerHTML = "";
    // 全要素モードでの描画ロジックは後で実装
  }, []);

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
  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => !prev);
    createToast(`Tailwind Inspector: ${!enabled ? "ON" : "OFF"}`);
  }, [enabled]);

  const toggleMode = useCallback(() => {
    setInspectorMode((prev) => !prev);
    createToast(`Mode: ${!inspectorMode ? "All (全要素)" : "Hover"}`);
  }, [inspectorMode]);

  const toggleLegend = useCallback(() => {
    setLegendVisible((prev) => !prev);
    createToast(`説明: ${!legendVisible ? "ON" : "OFF"}`);
  }, [legendVisible]);

  return {
    enabled,
    inspectorMode,
    legendVisible,
    tooltipData,
    tooltipVisible,
    mousePosition,
    globalLayerRef,
    toggleEnabled,
    toggleMode,
    toggleLegend,
  };
};
