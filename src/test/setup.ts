import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";

// Chrome APIのモック
(globalThis as any).chrome = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue({}),
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
  },
} as any;

// localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// getComputedStyle mock
Object.defineProperty(window, "getComputedStyle", {
  value: vi.fn().mockReturnValue({
    paddingTop: "8px",
    paddingRight: "16px",
    paddingBottom: "8px",
    paddingLeft: "16px",
    marginTop: "4px",
    marginRight: "0px",
    marginBottom: "4px",
    marginLeft: "0px",
    color: "rgb(0, 0, 0)",
    backgroundColor: "rgb(255, 255, 255)",
    fontSize: "14px",
    lineHeight: "20px",
    borderRadius: "4px",
    display: "block",
    gap: "0px",
    rowGap: "0px",
    columnGap: "0px",
  }),
  writable: true,
});

// ResizeObserver mock
(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// MutationObserver mock
(globalThis as any).MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(),
}));

// requestAnimationFrame mock
(globalThis as any).requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  return setTimeout(cb, 0);
});

(globalThis as any).cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
});
