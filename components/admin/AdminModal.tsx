"use client";

import { useEffect } from "react";

export default function AdminModal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-modal__head">
          <h2 id="admin-modal-title">{title}</h2>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="admin-modal__body">{children}</div>
        {footer ? <div className="admin-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
