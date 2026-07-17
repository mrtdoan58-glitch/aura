import { create } from "zustand";

interface UIState {
  toast: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    toast: null,
    showToast: (msg) => {
      set({ toast: msg });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => set({ toast: null }), 1900);
    },
    clearToast: () => set({ toast: null }),
  };
});
