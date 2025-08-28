import { Sides } from "../types";
import {
  toSides,
  createSegmentWithLabel,
  MAX_ELEMENTS,
  MAX_GAP_SEGMENTS,
} from "../utils";

export interface IVisualizationService {
  createPaddingOverlay(rect: DOMRect, pad: Sides): HTMLDivElement;
  createMarginOverlay(rect: DOMRect, mar: Sides): HTMLDivElement;
  createGapOverlay(
    rect: DOMRect,
    cs: CSSStyleDeclaration
  ): HTMLDivElement | null;
  createElementOutline(rect: DOMRect): HTMLDivElement;
  renderAllElements(container: HTMLDivElement): void;
}

export class VisualizationService implements IVisualizationService {
  createPaddingOverlay(rect: DOMRect, pad: Sides): HTMLDivElement {
    const paddingDiv = document.createElement("div");
    paddingDiv.className = "ti-overlay pad";
    paddingDiv.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 2147483645;
      border-top: ${pad.t}px solid rgba(120, 200, 80, 0.6);
      border-right: ${pad.r}px solid rgba(120, 200, 80, 0.6);
      border-bottom: ${pad.b}px solid rgba(120, 200, 80, 0.6);
      border-left: ${pad.l}px solid rgba(120, 200, 80, 0.6);
      box-sizing: border-box;
    `;

    // 数値ラベルを追加
    if (pad.t > 12 || pad.r > 12 || pad.b > 12 || pad.l > 12) {
      const label = this.createPaddingLabel(pad);
      paddingDiv.appendChild(label);
    }

    return paddingDiv;
  }

  createMarginOverlay(rect: DOMRect, mar: Sides): HTMLDivElement {
    const marginDiv = document.createElement("div");
    marginDiv.className = "ti-overlay mar";
    marginDiv.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY - mar.t}px;
      left: ${rect.left + window.scrollX - mar.l}px;
      width: ${rect.width + mar.l + mar.r}px;
      height: ${rect.height + mar.t + mar.b}px;
      pointer-events: none;
      z-index: 2147483644;
      border-top: ${mar.t}px solid rgba(255, 158, 67, 0.8);
      border-right: ${mar.r}px solid rgba(255, 158, 67, 0.8);
      border-bottom: ${mar.b}px solid rgba(255, 158, 67, 0.8);
      border-left: ${mar.l}px solid rgba(255, 158, 67, 0.8);
      box-sizing: border-box;
    `;

    // margin数値ラベルを追加
    this.addMarginLabels(marginDiv, mar);

    return marginDiv;
  }

  createGapOverlay(
    rect: DOMRect,
    cs: CSSStyleDeclaration
  ): HTMLDivElement | null {
    if (cs.display !== "flex" && cs.display !== "grid") {
      return null;
    }

    const gap = parseFloat(cs.gap) || 0;
    const rowGap = parseFloat(cs.rowGap) || gap;
    const columnGap = parseFloat(cs.columnGap) || gap;

    if (gap === 0 && rowGap === 0 && columnGap === 0) {
      return null;
    }

    const gapDiv = document.createElement("div");
    gapDiv.className = "ti-overlay gap";
    gapDiv.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 2147483643;
      outline: 2px dashed rgba(78, 205, 196, 0.8);
      background: rgba(78, 205, 196, 0.1);
    `;

    // gap数値ラベルを追加
    if (rect.width > 40 && rect.height > 20) {
      const label = this.createGapLabel(gap, rowGap, columnGap);
      gapDiv.appendChild(label);
    }

    return gapDiv;
  }

  createElementOutline(rect: DOMRect): HTMLDivElement {
    const outlineDiv = document.createElement("div");
    outlineDiv.className = "ti-overlay out";
    outlineDiv.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 2147483642;
      outline: 1px solid rgba(166, 172, 180, 0.6);
      background: rgba(166, 172, 180, 0.05);
    `;
    return outlineDiv;
  }

  renderAllElements(container: HTMLDivElement): void {
    container.innerHTML = "";

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

      // Margin segments using new createSegmentWithLabel approach
      if (hasMar) {
        // Top margin
        if (mar.t > 0) {
          container.appendChild(
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
          container.appendChild(
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
          container.appendChild(
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
          container.appendChild(
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

      // Padding segments using new createSegmentWithLabel approach
      if (hasPad) {
        // Top padding
        if (pad.t > 0) {
          container.appendChild(
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
          container.appendChild(
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
          container.appendChild(
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
          container.appendChild(
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

      // Gap drawing would be added here in future
      // gapSegs += drawGapsForContainer(el, container, cs, rect, MAX_GAP_SEGMENTS - gapSegs);

      drawn++;
      if (drawn >= MAX_ELEMENTS || gapSegs >= MAX_GAP_SEGMENTS) {
        break;
      }
    }
  }

  private createPaddingLabel(pad: Sides): HTMLDivElement {
    const paddingLabel = document.createElement("div");
    paddingLabel.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(120, 200, 80, 0.9);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
      white-space: nowrap;
      pointer-events: none;
      z-index: 2147483646;
    `;

    const values = [];
    if (pad.t > 0) values.push(`t:${Math.round(pad.t)}`);
    if (pad.r > 0) values.push(`r:${Math.round(pad.r)}`);
    if (pad.b > 0) values.push(`b:${Math.round(pad.b)}`);
    if (pad.l > 0) values.push(`l:${Math.round(pad.l)}`);

    paddingLabel.textContent = `P: ${values.join(" ")}`;
    return paddingLabel;
  }

  private addMarginLabels(marginDiv: HTMLDivElement, mar: Sides): void {
    const addMarginLabel = (
      side: "top" | "right" | "bottom" | "left",
      value: number
    ) => {
      const label = document.createElement("div");
      label.style.cssText = `
        position: absolute;
        background-color: rgba(255, 158, 67, 0.95);
        color: white;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 10px;
        font-family: monospace;
        white-space: nowrap;
        pointer-events: none;
        z-index: 2147483645;
      `;

      switch (side) {
        case "top":
          label.style.top = `${mar.t / 2 - 8}px`;
          label.style.left = "50%";
          label.style.transform = "translateX(-50%)";
          break;
        case "right":
          label.style.top = "50%";
          label.style.right = `${mar.r / 2 - 10}px`;
          label.style.transform = "translateY(-50%)";
          break;
        case "bottom":
          label.style.bottom = `${mar.b / 2 - 8}px`;
          label.style.left = "50%";
          label.style.transform = "translateX(-50%)";
          break;
        case "left":
          label.style.top = "50%";
          label.style.left = `${mar.l / 2 - 10}px`;
          label.style.transform = "translateY(-50%)";
          break;
      }

      label.textContent = `M:${Math.round(value)}`;
      marginDiv.appendChild(label);
    };

    if (mar.t > 0) addMarginLabel("top", mar.t);
    if (mar.r > 0) addMarginLabel("right", mar.r);
    if (mar.b > 0) addMarginLabel("bottom", mar.b);
    if (mar.l > 0) addMarginLabel("left", mar.l);
  }

  private createGapLabel(
    gap: number,
    rowGap: number,
    columnGap: number
  ): HTMLDivElement {
    const gapLabel = document.createElement("div");
    gapLabel.style.cssText = `
      position: absolute;
      top: 4px;
      left: 4px;
      background-color: rgba(78, 205, 196, 0.95);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
      white-space: nowrap;
      pointer-events: none;
      z-index: 2147483644;
    `;

    let gapText = "";
    if (gap > 0) {
      gapText = `Gap: ${Math.round(gap)}px`;
    } else {
      const parts = [];
      if (rowGap > 0) parts.push(`R:${Math.round(rowGap)}`);
      if (columnGap > 0) parts.push(`C:${Math.round(columnGap)}`);
      gapText = `Gap: ${parts.join(" ")}`;
    }

    gapLabel.textContent = gapText;
    return gapLabel;
  }
}
