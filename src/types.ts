export interface Sides {
  t: number;
  r: number;
  b: number;
  l: number;
}

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ComputedStyles {
  padding: Sides;
  margin: Sides;
  rowGap: string;
  columnGap: string;
  color: string;
  backgroundColor: string;
  fontSize: string;
  lineHeight: string;
  borderRadius: string;
}

export interface TooltipData {
  classes: string;
  fg: string;
  bg: string;
  pad: Sides;
  mar: Sides;
  fontSize: string;
  lineHeight: string;
  radius: string;
}

export interface Ring {
  root: HTMLDivElement;
  top: HTMLDivElement;
  right: HTMLDivElement;
  bottom: HTMLDivElement;
  left: HTMLDivElement;
}

export interface SideLabel {
  element: HTMLDivElement;
  show: (top: number, left: number, text: string) => void;
  hide: () => void;
}
