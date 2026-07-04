export interface StoredRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function useSharedTransition() {
  const saveRect = (id: string | number, el: HTMLElement) => {
    if (typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const rect: StoredRect = { top: r.top, left: r.left, width: r.width, height: r.height };
    try {
      sessionStorage.setItem(`card-rect-${id}`, JSON.stringify(rect));
    } catch {
      // ignore quota / disabled storage
    }
  };

  const getRect = (id: string | number): StoredRect | null => {
    if (typeof window === "undefined") return null;
    try {
      const s = sessionStorage.getItem(`card-rect-${id}`);
      if (!s) return null;
      sessionStorage.removeItem(`card-rect-${id}`);
      return JSON.parse(s) as StoredRect;
    } catch {
      return null;
    }
  };

  return { saveRect, getRect };
}
