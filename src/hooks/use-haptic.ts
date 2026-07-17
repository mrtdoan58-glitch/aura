export function useHaptic() {
  return () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
  };
}
