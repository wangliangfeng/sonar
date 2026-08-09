"use client";

import { useEffect } from "react";
import { useJournal } from "@/store/journal";

export function Toast() {
  const toast = useJournal((s) => s.toast);
  const showToast = useJournal((s) => s.showToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => showToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast, showToast]);

  if (!toast) return null;
  return <div className="toast">{toast}</div>;
}
