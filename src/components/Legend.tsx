import React, { useState, useRef, useCallback, useEffect } from "react";

interface LegendProps {
  visible: boolean;
}

export const Legend: React.FC<LegendProps> = React.memo(({ visible }) => {
  const [position, setPosition] = useState(() => {
    // localStorageから位置を復元
    const stored = localStorage.getItem("ti-legend-position");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // パース失敗時はデフォルト位置
      }
    }
    return { x: 20, y: 20 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("ti-legend-collapsed");
    return stored === "true";
  });

  const dragRef = useRef<{ startX: number; startY: number }>({
    startX: 0,
    startY: 0,
  });
  const legendRef = useRef<HTMLDivElement>(null);

  // 位置をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("ti-legend-position", JSON.stringify(position));
  }, [position]);

  // 折りたたみ状態をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("ti-legend-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // ヘッダー部分のみでドラッグを開始
      if ((e.target as HTMLElement).closest(".ti-legend-toggle")) return;

      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX - position.x,
        startY: e.clientY - position.y,
      };
      e.preventDefault();
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = Math.max(
        0,
        Math.min(window.innerWidth - 250, e.clientX - dragRef.current.startX)
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - 150, e.clientY - dragRef.current.startY)
      );

      setPosition({ x: newX, y: newY });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!visible) return null;

  return (
    <div
      ref={legendRef}
      id='ti-legend'
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 2147483646,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "8px",
        padding: "8px",
        width: isCollapsed ? "84px" : "200px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(4px)",
        transition: isDragging ? "none" : "all 0.2s ease",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: isCollapsed ? "0" : "8px",
          paddingBottom: isCollapsed ? "0" : "4px",
          borderBottom: isCollapsed
            ? "none"
            : "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <span style={{ color: "#fff", fontSize: "12px", fontWeight: "500" }}>
          Legend
        </span>
        <button
          className='ti-legend-toggle'
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: "none",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "4px",
            color: "#fff",
            cursor: "pointer",
            padding: "2px 6px",
            fontSize: "10px",
            lineHeight: "1",
          }}
          title={isCollapsed ? "展開" : "折りたたみ"}
        >
          {isCollapsed ? "+" : "−"}
        </button>
      </div>

      {/* コンテンツ */}
      {!isCollapsed && (
        <div style={{ color: "#fff", fontSize: "11px" }}>
          <div style={{ marginBottom: "6px", opacity: 0.8 }}>
            右下ボタンで ON/OFF・モード切替
          </div>

          <div
            className='item'
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span
              className='sw pad'
              style={{
                backgroundColor: "rgba(120, 200, 80, 0.8)",
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                marginRight: "6px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            ></span>
            Padding (緑)
          </div>

          <div
            className='item'
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span
              className='sw mar'
              style={{
                backgroundColor: "rgba(255, 158, 67, 0.8)",
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                marginRight: "6px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            ></span>
            Margin (オレンジ)
          </div>

          <div
            className='item'
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span
              className='sw gap'
              style={{
                backgroundColor: "rgba(78, 205, 196, 0.8)",
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                marginRight: "6px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            ></span>
            Gap (青緑)
          </div>

          <div
            className='item'
            style={{ display: "flex", alignItems: "center" }}
          >
            <span
              className='sw out'
              style={{
                backgroundColor: "rgba(166, 172, 180, 0.8)",
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                marginRight: "6px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            ></span>
            Element (グレー)
          </div>
        </div>
      )}
    </div>
  );
});
