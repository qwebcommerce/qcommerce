"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveStoreSettingsAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { StoreSettings } from "@/types";

function NumericInput({
  name,
  value,
  onValue,
}: {
  name: string;
  value: number;
  onValue: (next: number) => void;
}) {
  return (
    <input
      name={name}
      className="admin-input"
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      required
      value={Number.isFinite(value) ? String(value) : ""}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const raw = event.target.value.trim();
        if (raw === "") {
          onValue(0);
          return;
        }
        if (/^\d+$/.test(raw)) onValue(Number(raw));
      }}
    />
  );
}

export default function SettingsForm({ settings }: { settings: StoreSettings }) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [freeShippingFrom, setFreeShippingFrom] = useState(settings.freeShippingFrom);
  const [shippingFee, setShippingFee] = useState(settings.shippingFee);
  const [returnDays, setReturnDays] = useState(settings.returnDays);
  const [promoCode, setPromoCode] = useState(settings.promoCode);
  const [promoPercent, setPromoPercent] = useState(settings.promoPercent);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveStoreSettingsAction(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(t("toastSettingsSaved"));
      router.refresh();
    });
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{t("settings")}</h1>
        </div>
      </div>
      <p className="admin-field-hint" style={{ margin: "0 0 1.15rem" }}>
        {t("settingsIntro")}
      </p>
      <form onSubmit={save} className="admin-form-card">
        {error ? <p className="admin-form-error">{error}</p> : null}
        <p className="admin-kicker">{t("settingsShipping")}</p>
        <div className="admin-form-grid">
          <label>
            <span className="admin-label">{t("freeShippingFrom")}</span>
            <NumericInput name="freeShippingFrom" value={freeShippingFrom} onValue={setFreeShippingFrom} />
          </label>
          <label>
            <span className="admin-label">{t("shippingFee")}</span>
            <NumericInput name="shippingFee" value={shippingFee} onValue={setShippingFee} />
          </label>
        </div>
        <small className="admin-field-hint">{t("settingsHint")}</small>
        <p className="admin-kicker">{t("settingsReturns")}</p>
        <label>
          <span className="admin-label">{t("returnDays")}</span>
          <NumericInput name="returnDays" value={returnDays} onValue={setReturnDays} />
        </label>
        <small className="admin-field-hint">{t("returnDaysHint")}</small>
        <p className="admin-kicker">{t("settingsPromo")}</p>
        <div className="admin-form-grid">
          <label>
            <span className="admin-label">{t("promoCode")}</span>
            <input
              name="promoCode"
              className="admin-input"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
              placeholder={t("promoCodePlaceholder")}
              maxLength={24}
              autoComplete="off"
            />
          </label>
          <label>
            <span className="admin-label">{t("promoPercent")}</span>
            <NumericInput name="promoPercent" value={promoPercent} onValue={setPromoPercent} />
          </label>
        </div>
        <small className="admin-field-hint">{t("promoHint")}</small>
        <div className="admin-form-actions">
          <button type="submit" className="btn-gold" disabled={pending}>
            {pending ? t("saving") : t("saveSettings")}
          </button>
        </div>
      </form>
    </div>
  );
}
