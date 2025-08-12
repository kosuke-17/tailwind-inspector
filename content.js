(() => {
  // ===== State =====
  let enabled = true; // 常時ON/OFF（Ctrl+Shift+Yで切替）
  let holdAltToShow = false; // Alt押下で一時表示
  let mouseX = 0,
    mouseY = 0;

  // ===== Root & Layers =====
  const root = document.createElement("div");
  root.id = "ti-root";
  document.documentElement.appendChild(root);

  // アウトライン
  const outline = div("ti-box", { id: "ti-outline" });
  root.appendChild(outline);

  // リング（4分割）
  const padRing = ring("pad", "var(--ti-padding)");
  const marRing = ring("mar", "var(--ti-margin)");
  root.appendChild(marRing.root);
  root.appendChild(padRing.root);

  // サイド値ラベル
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

  // ツールチップ
  const tooltip = document.createElement("div");
  tooltip.id = "ti-tooltip";
  document.body.appendChild(tooltip);

  // 凡例
  const legend = document.createElement("div");
  legend.id = "ti-legend";
  legend.innerHTML = `表示: <span>Alt押しながらホバー / Ctrl+Shift+Yでトグル</span>
    <span class="item"><span class="sw pad"></span>Padding</span>
    <span class="item"><span class="sw mar"></span>Margin</span>
    <span class="item"><span class="sw out"></span>Element</span>`;
  document.body.appendChild(legend);

  // 初期は有効
  showUI(false);

  // ===== Event wiring =====
  document.addEventListener("keydown", (e) => {
    if (e.key === "Alt") {
      holdAltToShow = true;
      showUI(true); // Alt押下中は表示
    }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "y") {
      enabled = !enabled;
      showUI(enabled || holdAltToShow);
      toast(enabled ? "Tailwind Inspector: ON" : "Tailwind Inspector: OFF");
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "Alt") {
      holdAltToShow = false;
      showUI(enabled);
    }
  });

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isVisible()) return;
    tooltip.style.display = "block";
    tooltip.style.left = `${mouseX}px`;
    tooltip.style.top = `${mouseY}px`;
  });

  document.addEventListener(
    "mouseover",
    (e) => {
      if (!isVisible()) return;
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      try {
        inspect(el);
      } catch (err) {
        // console.warn('Inspector error', err);
      }
    },
    { capture: true }
  );

  window.addEventListener(
    "scroll",
    () => {
      // スクロール時も追従できるよう、最後の要素を再描画
      const el = document.elementFromPoint(mouseX, mouseY);
      if (isVisible() && el instanceof HTMLElement) inspect(el);
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

    // Marginリング（要素の外側）
    setOuterRing(marRing, top, left, width, height, mar);

    // Paddingリング（要素の内側）
    setInnerRing(padRing, top, left, width, height, pad);

    // サイド値ラベル配置
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

  // ===== Helpers (DOM builders) =====
  function div(className, attrs = {}) {
    const d = document.createElement("div");
    if (className) d.className = className;
    for (const [k, v] of Object.entries(attrs)) d.setAttribute(k, v);
    return d;
  }

  function ring(name, color) {
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
    // 上
    setBox(r.top, top - m.t, left - m.l, w + m.l + m.r, m.t);
    // 右
    setBox(r.right, top, left + w, m.r, h);
    // 下
    setBox(r.bottom, top + h, left - m.l, w + m.l + m.r, m.b);
    // 左
    setBox(r.left, top, left - m.l, m.l, h);
  }

  function setInnerRing(r, top, left, w, h, p) {
    // 上（要素内）
    setBox(r.top, top, left, w, p.t);
    // 右
    setBox(r.right, top, left + w - p.r, p.r, h);
    // 下
    setBox(r.bottom, top + h - p.b, left, w, p.b);
    // 左
    setBox(r.left, top, left, p.l, h);
  }

  function placeSideLabels(lbl, rect, pad, mar) {
    // パディングラベル
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

    // マージンラベル
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

  // ===== UI toggle =====
  function showUI(show) {
    if (show) {
      root.style.display = "block";
      legend.style.display = "block";
    } else {
      root.style.display = "none";
      legend.style.display = "none";
      tooltip.style.display = "none";
    }
  }
  function isVisible() {
    return enabled || holdAltToShow;
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
      .filter((c) => /^[a-z0-9:_/-]+$/i.test(c)) // ざっくり
      .join(" ");
  }

  function toHex(color) {
    // RGB(A) or already HEX
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

  // 画面右下に小さくトースト
  let toastTimer;
  function toast(text) {
    const n = document.createElement("div");
    n.style.position = "fixed";
    n.style.bottom = "16px";
    n.style.right = "16px";
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

  // 最初は非表示にしていたセグメントを表示可能に
  [padRing, marRing].forEach((r) => {
    [r.top, r.right, r.bottom, r.left].forEach(
      (seg) => (seg.style.display = "block")
    );
  });
})();
