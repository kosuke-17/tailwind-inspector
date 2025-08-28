export interface Sides {
  t: number;
  r: number;
  b: number;
  l: number;
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
