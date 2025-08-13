(() => {
  // ===== Config =====
  const MIN_LABEL_THICKNESS = 12; // 帯が細すぎる時はラベル非表示
  const MAX_ELEMENTS = 300; // Allモードでの最大対象要素数
  const MAX_GAP_SEGMENTS = 600; // AllモードでのGap帯セグメント上限
  const ROW_EPS = 6; // 行/列グルーピングの許容誤差(px)
  const COL_EPS = 6;

  // ===== State =====
  let enabled = localStorage.getItem("ti-enabled") === "true";
  let inspectorMode = localStorage.getItem("ti-inspector") === "true";
  let mouseX = 0,
    mouseY = 0;
  let rafQueued = false;
  // 新規: レジェンド表示状態（デフォルトtrue）
  let legendVisible = localStorage.getItem("ti-legend-visible") !== "false";

  // ===== Root & Layers =====
  const root = document.createElement("div");
  root.id = "ti-root";
  document.documentElement.appendChild(root);

  const globalLayer = document.createElement("div"); // インスペクターモードの描画先
  globalLayer.id = "ti-global";
  document.documentElement.appendChild(globalLayer);

  // Hoverモード用レイヤ
  const gapHoverLayer = document.createElement("div");
  Object.assign(gapHoverLayer.style, {
    position: "absolute",
    pointerEvents: "none",
    zIndex: "2147483647",
  });
  root.appendChild(gapHoverLayer);

  const outline = div("ti-box", { id: "ti-outline" });
  root.appendChild(outline);

  const padRing = ring("pad", "var(--ti-padding)");
  const marRing = ring("mar", "var(--ti-margin)");
  root.appendChild(marRing.root);
  root.appendChild(padRing.root);

  const labels = {
    padTop: sideLabel(),
    padRight: sideLabel(),
    padBottom: sideLabel(),
    padLeft: sideLabel(),
    marTop: sideLabel(),
    marRight: sideLabel(),
    marBottom: sideLabel(),
    marLeft: sideLabel(),
  };
  Object.values(labels).forEach((n) => root.appendChild(n));

  const tooltip = document.createElement("div");
  tooltip.id = "ti-tooltip";
  document.body.appendChild(tooltip);

  const legend = document.createElement("div");
  legend.id = "ti-legend";
  legend.innerHTML = `
    表示: 右下ボタンで ON/OFF・モード切替
    <span class="item"><span class="sw pad"></span>Padding</span>
    <span class="item"><span class="sw mar"></span>Margin</span>
    <span class="item"><span class="sw gap"></span>Gap</span>
    <span class="item"><span class="sw out"></span>Element</span>`;
  document.body.appendChild(legend);

  // ===== 右下ボタン群 =====
  const toggleHost = document.createElement("div");
  toggleHost.id = "ti-toggle";
  const btnPower = document.createElement("button");
  const btnMode = document.createElement("button");
  const btnLegend = document.createElement("button");
  const hint = document.createElement("span");
  hint.className = "hint";
  hint.textContent = "Tailwind Inspector";
  toggleHost.appendChild(btnPower);
  toggleHost.appendChild(btnMode);
  toggleHost.appendChild(btnLegend);
  toggleHost.appendChild(hint);
  document.body.appendChild(toggleHost);

  function updateButtons() {
    btnPower.className = enabled ? "on" : "off";
    btnPower.textContent = enabled ? "Inspector: ON" : "Inspector: OFF";
    btnPower.setAttribute("aria-pressed", String(enabled));

    btnMode.className = inspectorMode ? "on" : "off";
    btnMode.textContent = inspectorMode ? "Mode: All" : "Mode: Hover";
    btnMode.setAttribute("aria-pressed", String(inspectorMode));

    // 新規: Legend表示トグル
    btnLegend.className = legendVisible ? "on" : "off";
    btnLegend.textContent = legendVisible ? "説明: ON" : "説明: OFF";
    btnLegend.setAttribute("aria-pressed", String(legendVisible));

    if (!enabled) {
      showHoverUI(false);
      clearGlobal();
      legend.style.display = "none";
      tooltip.style.display = "none";
    } else {
      legend.style.display = legendVisible ? "block" : "none";
      if (inspectorMode) {
        showHoverUI(false);
        tooltip.style.display = "none";
        buildGlobalSoon();
      } else {
        clearGlobal();
        showHoverUI(true);
      }
    }
  }

  btnPower.addEventListener("click", () => {
    enabled = !enabled;
    localStorage.setItem("ti-enabled", String(enabled));
    updateButtons();
    toast(`Tailwind Inspector: ${enabled ? "ON" : "OFF"}`);
  });

  btnMode.addEventListener("click", () => {
    inspectorMode = !inspectorMode;
    localStorage.setItem("ti-inspector", String(inspectorMode));
    updateButtons();
    toast(`Mode: ${inspectorMode ? "All (全要素)" : "Hover"}`);
  });

  // 新規: Legend表示トグルのイベント
  btnLegend.addEventListener("click", () => {
    legendVisible = !legendVisible;
    localStorage.setItem("ti-legend-visible", String(legendVisible));
    updateButtons();
    toast(`説明: ${legendVisible ? "ON" : "OFF"}`);
  });

  updateButtons();

  // ===== Events =====
  document.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!enabled || inspectorMode) return;
      tooltip.style.display = "block";
      tooltip.style.left = `${mouseX}px`;
      tooltip.style.top = `${mouseY}px`;
    },
    { passive: true }
  );

  document.addEventListener(
    "mouseover",
    (e) => {
      if (!enabled || inspectorMode) return;
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      if (toggleHost.contains(el)) return;
      try {
        inspectHover(el);
      } catch {}
    },
    { capture: true }
  );

  window.addEventListener(
    "scroll",
    () => {
      if (enabled && inspectorMode) buildGlobalSoon();
      if (enabled && !inspectorMode) {
        const el = document.elementFromPoint(mouseX, mouseY);
        if (el instanceof HTMLElement && !toggleHost.contains(el))
          inspectHover(el);
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    if (enabled && inspectorMode) buildGlobalSoon();
  });

  const mo = new MutationObserver(() => {
    if (enabled && inspectorMode) buildGlobalSoon();
  });
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  // ===== Hoverモード =====
  function inspectHover(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hideHover();
      return;
    }
    const cs = getComputedStyle(el);
    const pad = toSides(cs, "padding");
    const mar = toSides(cs, "margin");

    const box = {
      top: rect.top + scrollY,
      left: rect.left + scrollX,
      width: rect.width,
      height: rect.height,
    };

    // アウトライン
    setBox(outline, box.top, box.left, box.width, box.height);

    // Margin（外側）
    setOuterRingWithLabels(
      marRing,
      box.top,
      box.left,
      box.width,
      box.height,
      mar
    );

    // Padding（内側）
    setInnerRingWithLabels(
      padRing,
      box.top,
      box.left,
      box.width,
      box.height,
      pad
    );

    // Gap（子要素間）
    gapHoverLayer.innerHTML = "";
    drawGapsForContainer(el, gapHoverLayer, cs, rect);

    // サイド値ラベル（従来）
    placeSideLabels(labels, box, pad, mar);

    // Tooltip
    const classes = extractTailwindClasses(el.className);
    tooltip.innerHTML = tooltipHTML({
      classes,
      fg: cs.color,
      bg: cs.backgroundColor,
      pad,
      mar,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      radius: cs.borderRadius,
    });
  }

  // ===== インスペクターモード（全要素） =====
  function buildGlobalSoon() {
    if (rafQueued) return;
    rafQueued = true;
    requestAnimationFrame(() => {
      rafQueued = false;
      buildGlobal();
    });
  }

  function buildGlobal() {
    clearGlobal();

    const vw = window.innerWidth,
      vh = window.innerHeight;
    const els = document.querySelectorAll("body *");
    let drawn = 0,
      gapSegs = 0;

    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      if (toggleHost.contains(el)) continue;
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

      const top = rect.top + scrollY;
      const left = rect.left + scrollX;
      const width = rect.width;
      const height = rect.height;

      if (hasMar) {
        globalLayer.appendChild(
          segWithLabel(
            top - mar.t,
            left - mar.l,
            width + mar.l + mar.r,
            mar.t,
            "var(--ti-margin)",
            mar.t,
            "h"
          )
        );
        globalLayer.appendChild(
          segWithLabel(
            top,
            left + width,
            mar.r,
            height,
            "var(--ti-margin)",
            mar.r,
            "v"
          )
        );
        globalLayer.appendChild(
          segWithLabel(
            top + height,
            left - mar.l,
            width + mar.l + mar.r,
            mar.b,
            "var(--ti-margin)",
            mar.b,
            "h"
          )
        );
        globalLayer.appendChild(
          segWithLabel(
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
      if (hasPad) {
        globalLayer.appendChild(
          segWithLabel(top, left, width, pad.t, "var(--ti-padding)", pad.t, "h")
        );
        globalLayer.appendChild(
          segWithLabel(
            top,
            left + width - pad.r,
            pad.r,
            height,
            "var(--ti-padding)",
            pad.r,
            "v"
          )
        );
        globalLayer.appendChild(
          segWithLabel(
            top + height - pad.b,
            left,
            width,
            pad.b,
            "var(--ti-padding)",
            pad.b,
            "h"
          )
        );
        globalLayer.appendChild(
          segWithLabel(
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

      // Gap（子要素間）
      gapSegs += drawGapsForContainer(
        el,
        globalLayer,
        cs,
        rect,
        MAX_GAP_SEGMENTS - gapSegs
      );

      drawn++;
      if (drawn >= MAX_ELEMENTS || gapSegs >= MAX_GAP_SEGMENTS) {
        toast(
          `Elements capped at ${MAX_ELEMENTS}, gap segments capped at ${MAX_GAP_SEGMENTS}`
        );
        break;
      }
    }
  }

  function clearGlobal() {
    globalLayer.innerHTML = "";
  }

  // ===== Gap描画 =====
  // 戻り値: 追加したセグメント数
  function drawGapsForContainer(
    containerEl,
    layer,
    cs,
    containerRect,
    remainBudget = Infinity
  ) {
    const rowGap = parseFloat(cs.rowGap) || 0;
    const colGap = parseFloat(cs.columnGap) || 0;
    if (rowGap <= 0 && colGap <= 0) return 0;

    // 直接の子のみ
    const children = Array.from(containerEl.children).filter(
      (n) =>
        n instanceof HTMLElement &&
        n.getBoundingClientRect().width > 0 &&
        n.getBoundingClientRect().height > 0
    );

    if (children.length <= 1) return 0;

    // rects取得（都度呼ぶと重いので1回で）
    const rects = children.map((el) => el.getBoundingClientRect());
    let segCount = 0;

    // --- 横方向ギャップ（列間 = columnGap）---
    if (colGap > 0) {
      // 行でグルーピング（topが近いものを同一行とみなす）
      const rows = groupBy(rects, (a, b) => Math.abs(a.top - b.top) <= ROW_EPS);
      for (const row of rows) {
        const sorted = row.sort((a, b) => a.left - b.left);
        for (let i = 0; i < sorted.length - 1; i++) {
          if (segCount >= remainBudget) return segCount;
          const a = sorted[i],
            b = sorted[i + 1];
          // ギャップ帯の位置（真ん中に固定幅colGap）
          const xMid = (a.right + b.left) / 2;
          const x = xMid - colGap / 2;
          const y = Math.min(a.top, b.top);
          const h = Math.max(a.bottom, b.bottom) - y;
          const seg = segWithLabel(
            y + scrollY,
            x + scrollX,
            colGap,
            h,
            "var(--ti-gap)",
            colGap,
            "v" // 縦帯なので縦向きラベル
          );
          layer.appendChild(seg);
          segCount++;
        }
      }
    }

    // --- 縦方向ギャップ（行間 = rowGap）---
    if (rowGap > 0) {
      // 列でグルーピング（leftが近いものを同一列とみなす）
      const cols = groupBy(
        rects,
        (a, b) => Math.abs(a.left - b.left) <= COL_EPS
      );
      for (const col of cols) {
        const sorted = col.sort((a, b) => a.top - b.top);
        for (let i = 0; i < sorted.length - 1; i++) {
          if (segCount >= remainBudget) return segCount;
          const a = sorted[i],
            b = sorted[i + 1];
          const yMid = (a.bottom + b.top) / 2;
          const y = yMid - rowGap / 2;
          // 横幅は重なり部分。重ならない場合はコンテナ幅にフォールバック
          let x = Math.max(a.left, b.left);
          let w = Math.min(a.right, b.right) - x;
          if (w <= 0) {
            x = containerRect.left;
            w = containerRect.width;
          }
          const seg = segWithLabel(
            y + scrollY,
            x + scrollX,
            w,
            rowGap,
            "var(--ti-gap)",
            rowGap,
            "h" // 横帯
          );
          layer.appendChild(seg);
          segCount++;
        }
      }
    }

    return segCount;
  }

  // rect配列を近さでグルーピング
  function groupBy(items, closeFn) {
    const groups = [];
    const sorted = items
      .slice()
      .sort((a, b) => a.top - b.top || a.left - b.left);
    for (const it of sorted) {
      let found = false;
      for (const g of groups) {
        if (closeFn(g[0], it)) {
          g.push(it);
          found = true;
          break;
        }
      }
      if (!found) groups.push([it]);
    }
    return groups;
  }

  // ===== DOM builders =====
  function div(className, attrs = {}) {
    const d = document.createElement("div");
    if (className) d.className = className;
    for (const [k, v] of Object.entries(attrs)) d.setAttribute(k, v);
    return d;
  }

  function ring(_name, color) {
    const root = div("ti-ring");
    const top = div("ti-ring-seg");
    const right = div("ti-ring-seg");
    const bottom = div("ti-ring-seg");
    const left = div("ti-ring-seg");
    [top, right, bottom, left].forEach((seg) => {
      seg.style.background = color;
      const lbl = document.createElement("div");
      lbl.className = "ti-seg-label";
      seg.appendChild(lbl);
      seg._label = lbl;
      root.appendChild(seg);
    });
    return { root, top, right, bottom, left };
  }

  function sideLabel() {
    const n = document.createElement("div");
    n.className = "ti-side-label";
    n.style.display = "none";
    return n;
  }

  function segWithLabel(
    top,
    left,
    width,
    height,
    color,
    valuePx,
    orientation /* 'h'|'v' */
  ) {
    if (width <= 0 || height <= 0) {
      const d = document.createElement("div");
      d.style.display = "none";
      return d;
    }
    const d = document.createElement("div");
    d.style.position = "absolute";
    d.style.pointerEvents = "none";
    d.style.zIndex = "2147483647";
    d.style.background = color;
    d.style.top = `${top}px`;
    d.style.left = `${left}px`;
    d.style.width = `${width}px`;
    d.style.height = `${height}px`;

    if (valuePx >= MIN_LABEL_THICKNESS) {
      const lbl = document.createElement("div");
      lbl.className = "ti-seg-label" + (orientation === "v" ? " v" : "");
      lbl.textContent = `${Math.round(valuePx)}px`;
      d.appendChild(lbl);
    }
    return d;
  }

  // ===== Layout helpers =====
  function setBox(node, top, left, width, height) {
    node.style.top = `${top}px`;
    node.style.left = `${left}px`;
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
    node.style.display = "block";
  }

  function setOuterRingWithLabels(r, top, left, w, h, m) {
    setBox(r.top, top - m.t, left - m.l, w + m.l + m.r, m.t);
    setSegLabel(r.top, m.t, "h");
    setBox(r.right, top, left + w, m.r, h);
    setSegLabel(r.right, m.r, "v");
    setBox(r.bottom, top + h, left - m.l, w + m.l + m.r, m.b);
    setSegLabel(r.bottom, m.b, "h");
    setBox(r.left, top, left - m.l, m.l, h);
    setSegLabel(r.left, m.l, "v");
  }

  function setInnerRingWithLabels(r, top, left, w, h, p) {
    setBox(r.top, top, left, w, p.t);
    setSegLabel(r.top, p.t, "h");
    setBox(r.right, top, left + w - p.r, p.r, h);
    setSegLabel(r.right, p.r, "v");
    setBox(r.bottom, top + h - p.b, left, w, p.b);
    setSegLabel(r.bottom, p.b, "h");
    setBox(r.left, top, left, p.l, h);
    setSegLabel(r.left, p.l, "v");
  }

  function setSegLabel(segEl, valuePx, orientation) {
    const lbl = segEl._label;
    if (!lbl) return;
    if (valuePx >= MIN_LABEL_THICKNESS) {
      lbl.textContent = `${Math.round(valuePx)}px`;
      lbl.style.display = "block";
      if (orientation === "v") lbl.classList.add("v");
      else lbl.classList.remove("v");
    } else {
      lbl.style.display = "none";
    }
  }

  function placeSideLabels(lbl, rect, pad, mar) {
    place(
      lbl.padTop,
      rect.top - 16,
      rect.left + rect.width / 2 - 12,
      `${pad.t}px`
    );
    place(
      lbl.padRight,
      rect.top + rect.height / 2 - 8,
      rect.left + rect.width + 4,
      `${pad.r}px`
    );
    place(
      lbl.padBottom,
      rect.top + rect.height + 4,
      rect.left + rect.width / 2 - 12,
      `${pad.b}px`
    );
    place(
      lbl.padLeft,
      rect.top + rect.height / 2 - 8,
      rect.left - 28,
      `${pad.l}px`
    );

    place(
      lbl.marTop,
      rect.top - (pad.t + 18) - 10,
      rect.left + rect.width / 2 - 12,
      `${mar.t}px`
    );
    place(
      lbl.marRight,
      rect.top + rect.height / 2 - 8,
      rect.left + rect.width + pad.r + 28,
      `${mar.r}px`
    );
    place(
      lbl.marBottom,
      rect.top + rect.height + pad.b + 10,
      rect.left + rect.width / 2 - 12,
      `${mar.b}px`
    );
    place(
      lbl.marLeft,
      rect.top + rect.height / 2 - 8,
      rect.left - (pad.l + 40),
      `${mar.l}px`
    );
  }

  function place(node, top, left, text) {
    node.textContent = text;
    node.style.top = `${top}px`;
    node.style.left = `${left}px`;
    node.style.display = "block";
  }

  function hideHover() {
    outline.style.display = "none";
    [padRing, marRing].forEach((r) => {
      r.top.style.display =
        r.right.style.display =
        r.bottom.style.display =
        r.left.style.display =
          "none";
      [r.top, r.right, r.bottom, r.left].forEach((seg) => {
        if (seg._label) seg._label.style.display = "none";
      });
    });
    Object.values(labels).forEach((n) => (n.style.display = "none"));
    tooltip.style.display = "none";
    gapHoverLayer.innerHTML = "";
  }

  function showHoverUI(show) {
    root.style.display = show ? "block" : "none";
    if (!show) hideHover();
  }

  // ===== Utils =====
  function toSides(cs, prop) {
    return {
      t: parseFloat(cs[`${prop}Top`]) || 0,
      r: parseFloat(cs[`${prop}Right`]) || 0,
      b: parseFloat(cs[`${prop}Bottom`]) || 0,
      l: parseFloat(cs[`${prop}Left`]) || 0,
    };
  }

  function tooltipHTML({
    classes,
    fg,
    bg,
    pad,
    mar,
    fontSize,
    lineHeight,
    radius,
  }) {
    const fgHex = toHex(fg);
    const bgHex = toHex(bg);
    return [
      row(`<strong>Tailwind</strong>: ${escapeHTML(classes || "(なし)")}`),
      row(`<span class="chip" style="background:${fg}"></span> Text: ${fgHex}`),
      row(
        `<span class="chip" style="background:${bg}; border:1px solid rgba(255,255,255,0.2)"></span> BG: ${bgHex}`
      ),
      row(`Padding: ${pad.t}/${pad.r}/${pad.b}/${pad.l}px`),
      row(`Margin: ${mar.t}/${mar.r}/${mar.b}/${mar.l}px`),
      row(`Font: ${fontSize}  Line: ${lineHeight}  Radius: ${radius}`),
    ].join("");
  }
  function row(html) {
    return `<div class="row">${html}</div>`;
  }

  function extractTailwindClasses(className) {
    if (!className) return "";
    return String(className)
      .split(/\s+/)
      .filter((c) => /^[a-z0-9:_\/-]+$/i.test(c))
      .join(" ");
  }

  function toHex(color) {
    if (!color) return "";
    if (color.startsWith("#")) return color;
    const m = color.match(
      /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\s*\)$/i
    );
    if (!m) return color;
    const r = clamp255(parseFloat(m[1]));
    const g = clamp255(parseFloat(m[2]));
    const b = clamp255(parseFloat(m[3]));
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    const hex = `#${to2(r)}${to2(g)}${to2(b)}`;
    return a < 1 ? `${hex}${to2(Math.round(a * 255))}` : hex;
  }
  const to2 = (n) => n.toString(16).padStart(2, "0");
  const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));
  function escapeHTML(s) {
    return s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        }[c])
    );
  }

  // 小さなトースト
  let toastTimer;
  function toast(text) {
    const n = document.createElement("div");
    n.style.position = "fixed";
    n.style.bottom = "16px";
    n.style.right = "16px";
    n.style.transform = "translateY(-64px)";
    n.style.background = "rgba(0,0,0,0.8)";
    n.style.color = "#fff";
    n.style.padding = "8px 10px";
    n.style.borderRadius = "6px";
    n.style.fontSize = "12px";
    n.style.zIndex = "2147483647";
    n.textContent = text;
    document.body.appendChild(n);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => n.remove(), 1400);
  }

  // 初期適用
  updateButtons();
})();
