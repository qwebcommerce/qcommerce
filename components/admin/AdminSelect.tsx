"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 168, maxHeight: 256 });
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  function place() {
    const node = buttonRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const width = Math.max(rect.width, 168);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 140 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(256, (openUp ? spaceAbove : spaceBelow) - 12));
    let left = rect.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    setPos({
      top: openUp ? Math.max(8, rect.top - maxHeight - 6) : rect.bottom + 6,
      left,
      width,
      maxHeight,
    });
  }

  useEffect(() => {
    if (!open) return;
    place();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onReposition = () => place();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, options.length]);

  return (
    <>
      <button
        ref={buttonRef}
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
          setOpen((current) => {
            if (!current) place();
            return !current;
          });
        }}
      >
        <span>{selected?.label ?? ""}</span>
        <ChevronIcon />
      </button>
      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className="admin-select-menu"
              role="listbox"
              aria-label={ariaLabel}
              style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
            >
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
