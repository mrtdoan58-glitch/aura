"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/store/ui-store";

export function Toast() {
  const toast = useUIStore((s) => s.toast);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
          role="status"
          aria-live="polite"
          className="fixed bottom-[110px] left-1/2 z-[90] whitespace-nowrap rounded-full bg-fg px-5 py-3 text-[13.5px] font-semibold text-bg shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
