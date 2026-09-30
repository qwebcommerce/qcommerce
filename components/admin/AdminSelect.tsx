"use client";

import { useEffect, useId, useRef, useState } from "react";

export type AdminSelectOption = { value: string; label: string };

export default function AdminSelect({
  value,
  options,
  onChange,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const generatedId = useId();
  const menuId = id ? `${id}-menu` : generatedId;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`admin-select-wrap${open ? " is-open" : ""}`}>
      <button
        id={id}
        type="button"
        className={`admin-select-trigger${className ? ` ${className}` : ""}`}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
      >
        <span>{selected?.label ?? ""}</span>
        <ChevronIcon />
      </button>
      {open ? (
        <div id={menuId} className="admin-select-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`admin-select-option${option.value === value ? " is-active" : ""}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
