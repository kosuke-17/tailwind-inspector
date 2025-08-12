(() => {
  // ===== State =====
  let enabled = localStorage.getItem("ti-enabled") === "true"; // ボタン状態を永続化
  let mouseX = 0,
    mouseY = 0;

  // ===== Root & Layers =====
  const root = document.createElement("div");
  root.id = "ti-root";
  document.documentElement.appendChild(root);

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
    表示: 右下のボタンで ON/OFF
    <span class="item"><span class="sw pad"></span>Padding</span>
    <span class="item"><span class="sw mar"></span>Margin</span>
    <span class="item"><span class="sw out"></span>Element</span>`;
  document.body.appendChild(legend);

  // ===== 右下トグルボタン =====
  const toggleHost = document.createElement("div");
  toggleHost.id = "ti-toggle";
  const toggleBtn = document.createElement("button");
  toggleHost.appendChild(toggleBtn);
  const hint = document.createElement("span");
  hint.className = "hint";
  hint.textContent = "Tailwind Inspector";
  toggleHost.appendChild(hint);
  document.body.appendChild(toggleHost);

  function updateToggleUI() {
    toggleBtn.className = enabled ? "on" : "off";
    toggleBtn.textContent = enabled ? "Inspector: ON" : "Inspector: OFF";
    toggleBtn.setAttribute("aria-pressed", String(enabled));
    showUI(enabled);
  }
  toggleBtn.addEventListener("click", () => {
    enabled = !enabled;
    localStorage.setItem("ti-enabled", String(enabled));
    updateToggleUI();
    toast(`Tailwind Inspector: ${enabled ? "ON" : "OFF"}`);
  });
  updateToggleUI();

  // ===== Events =====
  document.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!enabled) return;
      tooltip.style.display = "block";
      tooltip.style.left = `${mouseX}px`;
      tooltip.style.top = `${mouseY}px`;
    },
    { passive: true }
  );

  document.addEventListener(
    "mouseover",
    (e) => {
      if (!enabled) return;
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      // トグルボタン上では検査しない
      if (toggleHost.contains(el)) return;
      try {
        inspect(el);
      } catch {}
    },
    { capture: true }
  );

  window.addEventListener(
    "scroll",
    () => {
      if (!enabled) return;
      const el = document.elementFromPoint(mouseX, mouseY);
      if (el instanceof HTMLElement && !toggleHost.contains(el)) inspect(el);
    },
    { passive: true }
  );

  // ===== Core =====
  function inspect(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hideAll();
      return;
    }

    const styles = getComputedStyle(el);
    const pad = {
      t: parseFloat(styles.paddingTop) || 0,
      r: parseFloat(styles.paddingRight) || 0,
      b: parseFloat(styles.paddingBottom) || 0,
      l: parseFloat(styles.paddingLeft) || 0,
    };
    const mar = {
      t: parseFloat(styles.marginTop) || 0,
      r: parseFloat(styles.marginRight) || 0,
      b: parseFloat(styles.marginBottom) || 0,
      l: parseFloat(styles.marginLeft) || 0,
    };

    const top = rect.top + scrollY;
    const left = rect.left + scrollX;
    const width = rect.width;
    const height = rect.height;

    // アウトライン
    setBox(outline, top, left, width, height);

    // Margin（外側）
    setOuterRing(marRing, top, left, width, height, mar);

    // Padding（内側）
    setInnerRing(padRing, top, left, width, height, pad);

    // ラベル
    placeSideLabels(labels, { top, left, width, height }, pad, mar);

    // Tooltip
    const bg = styles.backgroundColor;
    const fg = styles.color;
    const classes = extractTailwindClasses(el.className);
    tooltip.innerHTML = tooltipHTML({
      classes,
      fg,
      bg,
      pad,
      mar,
      fontSize: styles.fontSize,
      lineHeight: styles.lineHeight,
      radius: styles.borderRadius,
    });
    tooltip.style.display = "block";

    legend.style.display = "block";
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

  // ===== Layout helpers =====
  function setBox(node, top, left, width, height) {
    node.style.top = `${top}px`;
    node.style.left = `${left}px`;
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
    node.style.display = "block";
  }
  function setOuterRing(r, top, left, w, h, m) {
    setBox(r.top, top - m.t, left - m.l, w + m.l + m.r, m.t);
    setBox(r.right, top, left + w, m.r, h);
    setBox(r.bottom, top + h, left - m.l, w + m.l + m.r, m.b);
    setBox(r.left, top, left - m.l, m.l, h);
  }
  function setInnerRing(r, top, left, w, h, p) {
    setBox(r.top, top, left, w, p.t);
    setBox(r.right, top, left + w - p.r, p.r, h);
    setBox(r.bottom, top + h - p.b, left, w, p.b);
    setBox(r.left, top, left, p.l, h);
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
  function hideAll() {
    outline.style.display = "none";
    [padRing, marRing].forEach((r) => {
      r.top.style.display =
        r.right.style.display =
        r.bottom.style.display =
        r.left.style.display =
          "none";
    });
    Object.values(labels).forEach((n) => (n.style.display = "none"));
    tooltip.style.display = "none";
    legend.style.display = "none";
  }

  // ===== UI visibility =====
  function showUI(show) {
    if (show) {
      root.style.display = "block";
      legend.style.display = "block";
      [padRing, marRing].forEach((r) => {
        r.top.style.display =
          r.right.style.display =
          r.bottom.style.display =
          r.left.style.display =
            "block";
      });
    } else {
      root.style.display = "none";
      legend.style.display = "none";
      tooltip.style.display = "none";
    }
  }

  // ===== Tooltip content =====
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

  // ===== Utils =====
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
    n.style.transform = "translateY(-48px)"; // ボタンとかぶらないよう少し上
    n.style.background = "rgba(0,0,0,0.8)";
    n.style.color = "#fff";
    n.style.padding = "8px 10px";
    n.style.borderRadius = "6px";
    n.style.fontSize = "12px";
    n.style.zIndex = "2147483647";
    n.textContent = text;
    document.body.appendChild(n);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => n.remove(), 1200);
  }

  // 初期表示状態に合わせてUIを整える
  updateToggleUI();
})();
