// Core層の共通型定義

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle extends Position, Size {}

// ドメインエラー
export class DomainError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

// 可視化設定
export interface VisualizationConfig {
  enabled: boolean;
  inspectorMode: boolean; // hover vs all
  legendVisible: boolean;
  minLabelThickness: number;
}

// イベント
export interface DomainEvent {
  type: string;
  timestamp: Date;
  data: unknown;
}

export class ElementInspectedEvent implements DomainEvent {
  type = "element_inspected";
  timestamp = new Date();

  constructor(public data: { elementId: string; className: string }) {}
}

export class VisualizationToggledEvent implements DomainEvent {
  type = "visualization_toggled";
  timestamp = new Date();

  constructor(public data: { enabled: boolean }) {}
}
