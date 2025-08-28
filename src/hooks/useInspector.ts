import { useState, useEffect, useCallback, useRef } from "react";
import { TooltipData } from "../types";
import { toSides, extractTailwindClasses, createToast, createSegmentWithLabel, debounce } from "../utils";

export const useInspector = () => {
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem("ti-enabled");
    return stored === null ? true : stored === "true"; // デフォルトをtrueに
  });
  const [inspectorMode, setInspectorMode] = useState(
    () => localStorage.getItem("ti-inspector") === "true"
  );
  const [legendVisible, setLegendVisible] = useState(() => {
    const stored = localStorage.getItem("ti-legend-visible");
    return stored === null ? true : stored !== "false"; // デフォルトをtrueに
  });
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [hoverElement, setHoverElement] = useState<Element | null>(null);

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

  // スクロール・リサイズイベント
  const handleScroll = useCallback(() => {
    if (enabled && inspectorMode) {
      buildGlobalSoon();
    }
    if (enabled && !inspectorMode && mousePosition) {
      const el = document.elementFromPoint(mousePosition.x, mousePosition.y);
      if (el instanceof HTMLElement && !el.closest("#ti-toggle")) {
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
  }, [enabled, inspectorMode, mousePosition]);

  const handleResize = useCallback(
    debounce(() => {
      if (enabled && inspectorMode) {
        buildGlobalSoon();
      }
    }, 100),
    [enabled, inspectorMode]
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
    if (!globalLayerRef.current) return;

    globalLayerRef.current.innerHTML = "";

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const els = document.querySelectorAll("body *");
    let drawn = 0;
    let gapSegs = 0;

    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.closest("#ti-toggle")) continue;
      if (el.id && el.id.startsWith("ti-")) continue;
      if ([...el.classList].some((c) => c.startsWith("ti-"))) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.bottom < 0 || rect.right < 0 || rect.top > vh || rect.left > vw)
        continue;

      const cs = getComputedStyle(el);
      const pad = toSides(cs, "padding");
      const mar = toSides(cs, "margin");

      const hasPad = pad.t || pad.r || pad.b || pad.l;
      const hasMar = mar.t || mar.r || mar.b || mar.l;

      const top = rect.top + window.scrollY;
      const left = rect.left + window.scrollX;
      const width = rect.width;
      const height = rect.height;

      // Margin segments
      if (hasMar) {
        // Top margin
        if (mar.t > 0) {
          globalLayerRef.current.appendChild(
            createSegmentWithLabel(
              top - mar.t,
              left - mar.l,
              width + mar.l + mar.r,
              mar.t,
              "var(--ti-margin)",
              mar.t,
              "h"
            )
          );
        }
        // Right margin
        if (mar.r > 0) {
          globalLayerRef.current.appendChild(
            createSegmentWithLabel(
              top,
              left + width,
              mar.r,
              height,
              "var(--ti-margin)",
              mar.r,
              "v"
            )
          );
        }
        // Bottom margin
        if (mar.b > 0) {
          globalLayerRef.current.appendChild(
            createSegmentWithLabel(
              top + height,
              left - mar.l,
              width + mar.l + mar.r,
              mar.b,
              "var(--ti-margin)",
              mar.b,
              "h"
            )
          );
        }
        // Left margin
        if (mar.l > 0) {
          globalLayerRef.current.appendChild(
            createSegmentWithLabel(
              top,
              left - mar.l,
              mar.l,
              height,
              "var(--ti-margin)",
              mar.l,
              "v"
            )
          );
        }
      }

      // Padding segments
      if (hasPad) {
        // Top padding
        if (pad.t > 0) {
          globalLayerRef.current.appendChild(
            createSegmentWithLabel(
              top,
              left,
              width,
              pad.t,
              "var(--ti-padding)",
              pad.t,
              "h"
            )
          );
        }
        // Right padding
        if (pad.r > 0) {
          globalLayerRef.current.appendChild(
            createSegmentWithLabel(
              top,
              left + width - pad.r,
              pad.r,
              height,
              "var(--ti-padding)",
              pad.r,
              "v"
            )
          );
        }
        // Bottom padding
        if (pad.b > 0) {
          globalLayerRef.current.appendChild(
            createSegmentWithLabel(
              top + height - pad.b,
              left,
              width,
              pad.b,
              "var(--ti-padding)",
              pad.b,
              "h"
            )
          );
        }
        // Left padding
        if (pad.l > 0) {
          globalLayerRef.current.appendChild(
            createSegmentWithLabel(
              top,
              left,
              pad.l,
              height,
              "var(--ti-padding)",
              pad.l,
              "v"
            )
          );
        }
      }

      drawn++;
      if (drawn >= 300 || gapSegs >= 600) {
        createToast(
          `Elements capped at 300, gap segments capped at 600`
        );
        break;
      }
    }
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
    hoverElement,
    globalLayerRef,
    toggleEnabled,
    toggleMode,
    toggleLegend,
  };
};