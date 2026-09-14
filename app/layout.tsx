import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { PreferencesProvider, PREFERENCE_BOOTSTRAP } from "@/lib/preferences";
import { ToastProvider } from "@/lib/toast";
import { defaultLocale, defaultThemeMode, theme, themeCss, type Locale } from "@/theme.config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${theme.brand.name} — ${theme.brand.tagline.en}`,
    template: `%s · ${theme.brand.name}`,
  },
  description: theme.brand.description.en,
  icons: { icon: "/logo.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const locale = (store.get("qc_locale")?.value === "ar" ? "ar" : defaultLocale) as Locale;
  const colorTheme = store.get("qc_theme")?.value === "dark" ? "dark" : defaultThemeMode;

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-theme={colorTheme}
      className={`${geistSans.variable} ${geistMono.variable} ${arabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
        <script dangerouslySetInnerHTML={{ __html: PREFERENCE_BOOTSTRAP }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PreferencesProvider initialLocale={locale} initialTheme={colorTheme}>
          <ToastProvider>{children}</ToastProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
