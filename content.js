(() => {
  // ===== Config =====
  const MIN_LABEL_THICKNESS = 12; // px未満の帯はラベル非表示（視認性とパフォーマンス目的）

  // ===== State =====
  let enabled = localStorage.getItem("ti-enabled") === "true"; // 表示ON/OFF
  let inspectorMode = localStorage.getItem("ti-inspector") === "true"; // false=Hover, true=All
  let mouseX = 0,
    mouseY = 0;
  let rafQueued = false;
  const MAX_ELEMENTS = 300; // Allモードの最大描画要素数

  // ===== Root & Layers =====
  const root = document.createElement("div");
  root.id = "ti-root";
  document.documentElement.appendChild(root);

  const globalLayer = document.createElement("div"); // インスペクターモード用
  globalLayer.id = "ti-global";
  document.documentElement.appendChild(globalLayer);

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
    <span class="item"><span class="sw out"></span>Element</span>`;
  document.body.appendChild(legend);

  // ===== 右下ボタン群 =====
  const toggleHost = document.createElement("div");
  toggleHost.id = "ti-toggle";
  const btnPower = document.createElement("button");
  const btnMode = document.createElement("button");
  const hint = document.createElement("span");
  hint.className = "hint";
  hint.textContent = "Tailwind Inspector";
  toggleHost.appendChild(btnPower);
  toggleHost.appendChild(btnMode);
  toggleHost.appendChild(hint);
  document.body.appendChild(toggleHost);

  function updateButtons() {
    btnPower.className = enabled ? "on" : "off";
    btnPower.textContent = enabled ? "Inspector: ON" : "Inspector: OFF";
    btnPower.setAttribute("aria-pressed", String(enabled));

    btnMode.className = inspectorMode ? "on" : "off";
    btnMode.textContent = inspectorMode ? "Mode: All" : "Mode: Hover";
    btnMode.setAttribute("aria-pressed", String(inspectorMode));

    // 表示制御
    if (!enabled) {
      showHoverUI(false);
      clearGlobal();
      legend.style.display = "none";
      tooltip.style.display = "none";
    } else {
      legend.style.display = "block";
      if (inspectorMode) {
        showHoverUI(false); // ホバーUIはオフ
        tooltip.style.display = "none";
        buildGlobalSoon(); // 全体描画
      } else {
        clearGlobal();
        showHoverUI(true); // ホバーUIはオン
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

  updateButtons(); // 初期反映

  // ===== Events =====
  document.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!enabled || inspectorMode) return; // All中はツールチップ抑制
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
      if (toggleHost.contains(el)) return; // 自分は無視
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

    // Margin（外側／値ラベルを帯の中に）
    setOuterRingWithLabels(
      marRing,
      box.top,
      box.left,
      box.width,
      box.height,
      mar
    );

    // Padding（内側／値ラベルを帯の中に）
    setInnerRingWithLabels(
      padRing,
      box.top,
      box.left,
      box.width,
      box.height,
      pad
    );

    // 外側の補助ラベル（従来のサイド値）
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
    let drawn = 0;

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
      if (!hasPad && !hasMar) continue;

      const top = rect.top + scrollY;
      const left = rect.left + scrollX;
      const width = rect.width;
      const height = rect.height;

      // 余白帯＋中央ラベル
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
        ); // top
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
        ); // right
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
        ); // bottom
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
        ); // left
      }
      if (hasPad) {
        globalLayer.appendChild(
          segWithLabel(top, left, width, pad.t, "var(--ti-padding)", pad.t, "h")
        ); // top
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
        ); // right
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
        ); // bottom
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
        ); // left
      }

      drawn++;
      if (drawn >= MAX_ELEMENTS) {
        toast(`Elements capped at ${MAX_ELEMENTS} for performance`);
        break;
      }
    }
  }

  function clearGlobal() {
    globalLayer.innerHTML = "";
  }

  // ===== Builders =====
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
      // ラベル要素を持たせる
      const lbl = document.createElement("div");
      lbl.className = "ti-seg-label";
      seg.appendChild(lbl);
      // プロパティとして保持（expando）
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
    // 上
    setBox(r.top, top - m.t, left - m.l, w + m.l + m.r, m.t);
    setSegLabel(r.top, m.t, "h");
    // 右
    setBox(r.right, top, left + w, m.r, h);
    setSegLabel(r.right, m.r, "v");
    // 下
    setBox(r.bottom, top + h, left - m.l, w + m.l + m.r, m.b);
    setSegLabel(r.bottom, m.b, "h");
    // 左
    setBox(r.left, top, left - m.l, m.l, h);
    setSegLabel(r.left, m.l, "v");
  }

  function setInnerRingWithLabels(r, top, left, w, h, p) {
    // 上
    setBox(r.top, top, left, w, p.t);
    setSegLabel(r.top, p.t, "h");
    // 右
    setBox(r.right, top, left + w - p.r, p.r, h);
    setSegLabel(r.right, p.r, "v");
    // 下
    setBox(r.bottom, top + h - p.b, left, w, p.b);
    setSegLabel(r.bottom, p.b, "h");
    // 左
    setBox(r.left, top, left, p.l, h);
    setSegLabel(r.left, p.l, "v");
  }

  function setSegLabel(segEl, valuePx, orientation /* 'h'|'v' */) {
    const lbl = segEl._label; // ring() 内で付与
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
      .filter((c) => /^[a-z0-9:_/-]+$/i.test(c))
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
    n.style.transform = "translateY(-64px)"; // ボタンと被らないよう少し上
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
