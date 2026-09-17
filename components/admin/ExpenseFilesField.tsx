"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { removeExpenseFileAction, uploadExpenseFileAction } from "@/lib/actions";
import {
  formatFileSize,
  isPreviewableExpenseFile,
  MAX_EXPENSE_FILE_BYTES,
  MAX_EXPENSE_FILES,
} from "@/lib/expenses";
import { usePreferences } from "@/lib/preferences";
import type { ExpenseFile } from "@/types";

export type DraftExpenseFile = ExpenseFile & { previewUrl?: string };

export default function ExpenseFilesField({
  expenseId,
  files,
  onChange,
}: {
  expenseId?: string;
  files: DraftExpenseFile[];
  onChange: (files: DraftExpenseFile[]) => void;
}) {
  const { t } = usePreferences();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyName, setBusyName] = useState("");

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(file.previewUrl);
      });
    };
    // revoke only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function accept(file: File) {
    if (file.size > MAX_EXPENSE_FILE_BYTES) {
      setLocalError(t("expenseFileTooLarge"));
      return false;
    }
    return true;
  }

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list).filter(accept);
    const room = MAX_EXPENSE_FILES - files.length;
    if (room <= 0) {
      setLocalError(t("expenseFileLimit"));
      return;
    }
    const chosen = incoming.slice(0, room);
    if (!chosen.length) return;
    if (incoming.length > room) setLocalError(t("expenseFileLimit"));
    else setLocalError("");
    startTransition(async () => {
      const next = [...files];
      for (const file of chosen) {
        setBusyName(file.name);
        const form = new FormData();
        form.set("file", file);
        const result = await uploadExpenseFileAction(form);
        if (result.error || !("file" in result) || !result.file) {
          setLocalError(result.error || t("toastError"));
          continue;
        }
        next.push({
          ...result.file,
          previewUrl: URL.createObjectURL(file),
        });
        onChange([...next]);
      }
      setBusyName("");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function removeAt(index: number) {
    const target = files[index];
    if (!target) return;
    startTransition(async () => {
      if (target.previewUrl?.startsWith("blob:")) {
        const form = new FormData();
        form.set("path", target.path);
        await removeExpenseFileAction(form);
        URL.revokeObjectURL(target.previewUrl);
      }
      onChange(files.filter((_, i) => i !== index));
    });
  }

  return (
    <div>
      <span className="admin-label">{t("expenseFiles")}</span>
      <div
        className={`admin-files${dragging ? " is-drag" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!pending) addFiles(event.dataTransfer.files);
        }}
      >
        {files.map((file, index) => {
          const viewHref = file.previewUrl || (expenseId ? `/api/admin/expenses/${expenseId}/files/${file.id}` : "");
          const downloadHref = file.previewUrl
            ? file.previewUrl
            : expenseId
              ? `/api/admin/expenses/${expenseId}/files/${file.id}?download=1`
              : "";
          const image = file.type.startsWith("image/") ? viewHref : "";
          return (
            <article key={file.id} className="admin-file-card">
              <div className="admin-file-card__preview">
                {image ? (
                  <img src={image} alt="" />
                ) : (
                  <span>{file.name.split(".").pop()?.toUpperCase() || "FILE"}</span>
                )}
              </div>
              <div className="admin-file-card__meta">
                <strong title={file.name}>{file.name}</strong>
                <em>{formatFileSize(file.size)}</em>
                <div className="admin-file-card__actions">
                  {viewHref && isPreviewableExpenseFile(file.type) ? (
                    <a href={viewHref} target="_blank" rel="noreferrer" className="admin-text-btn">
                      {t("expenseViewFile")}
                    </a>
                  ) : null}
                  {downloadHref ? (
                    <a href={downloadHref} download={file.name} className="admin-text-btn">
                      {t("expenseDownload")}
                    </a>
                  ) : null}
                  <button type="button" className="admin-text-btn admin-text-btn--danger" onClick={() => removeAt(index)} disabled={pending}>
                    {t("expenseRemoveFile")}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {files.length < MAX_EXPENSE_FILES ? (
          <label htmlFor={inputId} className="admin-file-add">
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,.csv,.txt,.doc,.docx,.xls,.xlsx"
              disabled={pending}
              onChange={(event) => addFiles(event.target.files)}
            />
            <span>{pending && busyName ? busyName : t("expenseChooseFiles")}</span>
          </label>
        ) : null}
      </div>
      <small className="admin-field-hint">{t("expenseFilesHint")}</small>
      {localError ? <p className="admin-form-error">{localError}</p> : null}
    </div>
  );
}
