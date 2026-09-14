"use client";

import ImageUpload from "@/components/admin/ImageUpload";
import { usePreferences } from "@/lib/preferences";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 8;

export default function ProductImagesUpload({
  images,
  files,
  onChange,
}: {
  images: string[];
  files: File[];
  onChange: (next: { images: string[]; files: File[] }) => void;
}) {
  const { t } = usePreferences();
  const count = images.length + files.length;

  function addFiles(list: File[]) {
    const room = MAX_IMAGES - images.length - files.length;
    if (room <= 0) return;
    const accepted = list
      .filter((file) => file.type.startsWith("image/") && file.type !== "image/svg+xml" && file.size <= MAX_BYTES)
      .slice(0, room);
    if (!accepted.length) return;
    onChange({ images, files: [...files, ...accepted] });
  }

  return (
    <div>
      <span className="admin-label">{t("productImages")}</span>
      <div className="admin-image-grid">
        {images.map((src) => (
          <ImageUpload
            key={src}
            gallery
            value={src}
            onFile={(file) => onChange({ images: images.filter((image) => image !== src), files: [...files, file] })}
            onRemove={() => onChange({ images: images.filter((image) => image !== src), files })}
          />
        ))}
        {files.map((file, index) => (
          <ImageUpload
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            gallery
            value=""
            file={file}
            onFile={(next) => onChange({ images, files: files.map((current, i) => (i === index ? next : current)) })}
            onRemove={() => onChange({ images, files: files.filter((_, i) => i !== index) })}
          />
        ))}
        {count < MAX_IMAGES ? <ImageUpload gallery value="" multiple onFiles={addFiles} /> : null}
      </div>
      <small className="admin-field-hint">{t("productImagesHint")}</small>
    </div>
  );
}
