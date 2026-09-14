"use client";

import { useMemo, useSyncExternalStore } from "react";

export type ToastKind = "success" | "error";

type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
};

type ToastApi = {
  push: (toast: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
};

const listeners = new Set<() => void>();
let items: ToastItem[] = [];
const timers = new Map<string, number>();

function emit() {
  listeners.forEach((listener) => listener());
}

function dismiss(id: string) {
  const timer = timers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    timers.delete(id);
  }
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(toast: Omit<ToastItem, "id">) {
  const id = crypto.randomUUID();
  items = [...items.slice(-4), { ...toast, id }];
  emit();
  timers.set(
    id,
    window.setTimeout(() => dismiss(id), 4800),
  );
}

export const toast: ToastApi = {
  push,
  success: (title, message) => push({ kind: "success", title, message }),
  error: (title, message) => push({ kind: "error", title, message }),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const visible = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => items,
    () => items,
  );

  return (
    <>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {visible.map((item) => (
          <div key={item.id} className={`toast toast--${item.kind}`} role="status">
            <span className="toast__mark" aria-hidden="true">
              {item.kind === "success" ? "✓" : "!"}
            </span>
            <div className="toast__body">
              <strong>{item.title}</strong>
              {item.message ? <p>{item.message}</p> : null}
            </div>
            <button type="button" className="toast__close" onClick={() => dismiss(item.id)} aria-label="Close">
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export function useToast() {
  return useMemo(() => toast, []);
}
