import { theme } from "@/theme.config";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://voombaza.com").replace(/\/$/, "");
}

export function emailFrom() {
  return process.env.EMAIL_FROM || `${theme.brand.display} <onboarding@resend.dev>`;
}

export function adminNotifyEmail() {
  return (process.env.EMAIL_ADMIN || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export function emailBrand() {
  const palette = theme.colors.light;
  return {
    name: theme.brand.display,
    legalName: theme.brand.name,
    tagline: theme.brand.tagline.en,
    taglineAr: theme.brand.tagline.ar,
    accent: palette.accent,
    gold: palette.accent,
    bg: palette.bgAlt,
    surface: palette.surface,
    ink: palette.text,
    muted: palette.muted,
    line: palette.border,
    footer: palette.footer,
    logo: `${siteUrl()}/logo.png`,
    shopUrl: `${siteUrl()}/shop`,
    accountOrdersUrl: `${siteUrl()}/account/orders`,
  };
}
