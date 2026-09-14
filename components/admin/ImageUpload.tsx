"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePreferences } from "@/lib/preferences";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const MAX_BYTES = 10 * 1024 * 1024;

export default function ImageUpload({
  value,
  file,
  onFile,
  onRemove,
  disabled,
  compact,
  tile,
  gallery,
  label,
  multiple,
  onFiles,
}: {
  value: string;
  file?: File | null;
  onFile?: (file: File) => void;
  onRemove?: () => void;
  disabled?: boolean;
  compact?: boolean;
  tile?: boolean;
  gallery?: boolean;
  label?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
}) {
  const { t } = usePreferences();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const [blobUrl, setBlobUrl] = useState("");
  const square = compact || tile || gallery;

  useEffect(() => {
    if (!file) {
      setBlobUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const preview = blobUrl || value;

  function acceptFile(next: File) {
    if (!next.type.startsWith("image/") || next.type === "image/svg+xml") {
      setLocalError(t("imageTypeInvalid"));
      return false;
    }
    if (next.size > MAX_BYTES) {
      setLocalError(t("imageTooLarge"));
      return false;
    }
    return true;
  }

  function pick(list: FileList | null) {
    if (!list?.length) return;
    const valid = Array.from(list).filter(acceptFile);
    if (!valid.length) return;
    setLocalError("");
    if (multiple && onFiles) onFiles(valid);
    else if (onFile) onFile(valid[0]);
    if (inputRef.current) inputRef.current.value = "";
  }

  const wrapClass = tile ? "admin-upload-tile-wrap" : gallery ? "admin-upload-gallery-wrap" : undefined;

  return (
    <div className={wrapClass} title={localError || undefined}>
      {square ? null : <span className="admin-label">{label || t("categoryImage")}</span>}
      <div
        className={`admin-upload${compact ? " admin-upload--compact" : ""}${tile ? " admin-upload--tile" : ""}${gallery ? " admin-upload--gallery" : ""}${dragging ? " is-drag" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) pick(event.dataTransfer.files);
        }}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => pick(event.target.files)}
        />
        {preview ? (
          <label htmlFor={inputId} className="admin-upload__preview">
            <img src={preview} alt="" />
          </label>
        ) : (
          <label htmlFor={inputId} className="admin-upload__empty">
            {square ? "+" : t("imageDrop")}
          </label>
        )}
        {tile || gallery ? (
          preview && onRemove ? (
            <button type="button" className="admin-upload__x" onClick={onRemove} disabled={disabled} aria-label={t("imageRemove")}>
              ×
            </button>
          ) : null
        ) : (
          <div className="admin-upload__actions">
            {compact && !preview ? null : (
              <label htmlFor={inputId} className="admin-text-btn admin-text-btn--gold">
                {preview ? t("imageReplace") : t("imageChoose")}
              </label>
            )}
            {preview && onRemove ? (
              <button type="button" className="admin-text-btn admin-text-btn--danger" onClick={onRemove} disabled={disabled}>
                {t("imageRemove")}
              </button>
            ) : null}
          </div>
        )}
      </div>
      {square ? null : <small className="admin-field-hint">{t("imageHint")}</small>}
      {tile || gallery ? null : localError ? <p className="admin-form-error">{localError}</p> : null}
    </div>
  );
}
