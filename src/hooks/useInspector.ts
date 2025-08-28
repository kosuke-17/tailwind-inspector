// SOLID原則に基づいてリファクタリングされたuseInspector
// 後方互換性のために、新しい実装を使用しながら同じインターフェースを提供
// リモートから追加された新機能（hoverElement、debounce、createSegmentWithLabel）も統合済み
export { useInspectorRefactored as useInspector } from "./useInspectorRefactored";