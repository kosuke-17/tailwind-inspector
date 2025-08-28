export interface IDOMService {
  setupEventListeners(handlers: {
    onMouseMove: (e: MouseEvent) => void;
    onMouseOver: (e: Event) => void;
    onScroll: () => void;
    onResize: () => void;
  }): () => void;
  setupMutationObserver(callback: () => void): () => void;
}

export class DOMService implements IDOMService {
  setupEventListeners(handlers: {
    onMouseMove: (e: MouseEvent) => void;
    onMouseOver: (e: Event) => void;
    onScroll: () => void;
    onResize: () => void;
  }): () => void {
    document.addEventListener("mousemove", handlers.onMouseMove, {
      passive: true,
    });
    document.addEventListener("mouseover", handlers.onMouseOver, {
      capture: true,
      passive: true,
    });
    window.addEventListener("scroll", handlers.onScroll, { passive: true });
    window.addEventListener("resize", handlers.onResize, { passive: true });

    // クリーンアップ関数を返す
    return () => {
      document.removeEventListener("mousemove", handlers.onMouseMove);
      document.removeEventListener("mouseover", handlers.onMouseOver, {
        capture: true,
      });
      window.removeEventListener("scroll", handlers.onScroll);
      window.removeEventListener("resize", handlers.onResize);
    };
  }

  setupMutationObserver(callback: () => void): () => void {
    const observer = new MutationObserver(callback);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // クリーンアップ関数を返す
    return () => observer.disconnect();
  }
}
