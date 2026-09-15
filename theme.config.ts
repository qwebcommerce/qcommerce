/**
 * Client theme — change this file to rebrand the store.
 * Colors, copy, currency, nav, and homepage content all live here.
 */

export type Locale = "en" | "ar";
export type Localized = Record<Locale, string>;

export const locales: Locale[] = ["en", "ar"];
export const defaultLocale: Locale = "en";
export const defaultThemeMode: "light" | "dark" = "light";

export const theme = {
  brand: {
    name: "VOOMBAZA",
    display: "Voombaza",
    tagline: {
      en: "Premium Streetwear · GCC",
      ar: "أزياء الشارع الفاخرة · الخليج",
    } satisfies Localized,
    description: {
      en: "Premium streetwear for those who define their own path. Born in the Gulf, built for the world.",
      ar: "أزياء شارع فاخرة لمن يرسم طريقه بنفسه. وُلدت في الخليج، وصُممت للعالم.",
    } satisfies Localized,
    instagram: "@voombaza",
  },

  colors: {
    light: {
      accent: "#C9A96E",
      accentLight: "#D8BC8E",
      accentDark: "#8B6914",
      bg: "#FAF9F7",
      bgAlt: "#F2EFE9",
      surface: "#FFFFFF",
      text: "#0D0D0D",
      muted: "#6B6868",
      border: "#E6E0D6",
      sale: "#E8605A",
      footer: "#080808",
      navSolid: "rgba(255,255,255,0.97)",
    },
    dark: {
      accent: "#C9A96E",
      accentLight: "#D8BC8E",
      accentDark: "#8B6914",
      bg: "#0D0D0D",
      bgAlt: "#161616",
      surface: "#1C1C1C",
      text: "#FAF9F7",
      muted: "#A8A19A",
      border: "#2A2A2A",
      sale: "#E8605A",
      footer: "#080808",
      navSolid: "rgba(13,13,13,0.94)",
    },
  },

  commerce: {
    currency: "QAR",
    freeShippingFrom: 500,
    shippingFee: 25,
    promoCode: "VB20",
    promoPercent: 20,
    countries: ["🇶🇦 Qatar", "🇦🇪 UAE", "🇸🇦 KSA", "🇰🇼 Kuwait", "🇧🇭 Bahrain", "🇴🇲 Oman"],
    payments: ["VISA", "MC", "AMEX", "MADA", "KNET", "TABBY"],
    checkoutCountries: ["Qatar", "UAE", "KSA", "Kuwait", "Bahrain", "Oman"],
  },

  nav: {
    left: [{ key: "collections", href: "/shop" }],
    right: [],
  },

  announcement: {
    en: "Free Shipping Across GCC on Orders Above QAR {amount} · Easy 14-Day Returns · Code {code} — {percent}% Off First Order",
    ar: "شحن مجاني في الخليج للطلبات فوق {amount} ر.ق · إرجاع خلال 14 يوماً · استخدم {code} لخصم {percent}% على أول طلب",
  } satisfies Localized,

  hero: [
    {
      img: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1920&q=85&fit=crop&crop=top",
      align: "left" as const,
      eyebrow: { en: "SS25 Collection", ar: "مجموعة صيف 25" },
      headline: { en: "Define Your Style", ar: "حدّد أسلوبك" },
      sub: { en: "Premium streetwear crafted for the modern man.", ar: "أزياء شارع فاخرة صُممت للرجل العصري." },
      cta1: { key: "shopCollection", href: "/shop" },
      cta2: { key: "viewLookbook", href: "/shop/new-arrivals" },
    },
    {
      img: "https://images.unsplash.com/photo-1536766820879-059fec98ec0a?w=1920&q=85&fit=crop&crop=faces",
      align: "left" as const,
      eyebrow: { en: "Exclusive GCC Drop", ar: "إصدار حصري للخليج" },
      headline: { en: "Crafted for the Bold", ar: "صُنع للجرئين" },
      sub: { en: "Exclusive pieces, available now across the Gulf.", ar: "قطع حصرية متوفرة الآن في الخليج." },
      cta1: { key: "discoverNow", href: "/shop" },
      cta2: { key: "exploreAll", href: "/shop" },
    },
    {
      img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85&fit=crop",
      align: "center" as const,
      eyebrow: { en: "New Season In", ar: "الموسم الجديد" },
      headline: { en: "The New Season is Here", ar: "الموسم الجديد هنا" },
      sub: { en: "Drop everything. New season drops, only at Voombaza.", ar: "وصل الموسم الجديد حصرياً لدى فومبازا." },
      cta1: { key: "shopNewIn", href: "/shop/new-arrivals" },
      cta2: { key: "seeWhatsNew", href: "/shop" },
    },
  ],

  marquee: {
    accent: {
      en: ["FREE SHIPPING ACROSS GCC", "EASY 14-DAY RETURNS", "EXCLUSIVE DROPS EVERY WEEK", "SHOP IN QAR", "PREMIUM QUALITY GUARANTEED", "AUTHENTIC STREETWEAR"],
      ar: ["شحن مجاني في الخليج", "إرجاع خلال 14 يوماً", "إصدارات حصرية كل أسبوع", "التسوق بالريال القطري", "جودة فاخرة مضمونة", "أزياء شارع أصلية"],
    },
    muted: {
      en: ["NEW SEASON IN", "SS25 COLLECTION NOW LIVE", "SHIPS TO KSA · UAE · QAT · KWT · BHR · OMN", "USE CODE VB20 FOR 20% OFF", "LIMITED DROPS", "PREMIUM MENSWEAR"],
      ar: ["الموسم الجديد", "مجموعة صيف 25 متوفرة الآن", "شحن إلى السعودية · الإمارات · قطر · الكويت · البحرين · عُمان", "استخدم VB20 لخصم 20%", "إصدارات محدودة", "أزياء رجالية فاخرة"],
    },
  },

  press: [
    { name: "VOGUE", sub: "Arabia" },
    { name: "GQ", sub: "Middle East" },
    { name: "ESQUIRE", sub: "ME" },
    { name: "HYPEBEAST", sub: "" },
    { name: "GRAZIA", sub: "Middle East" },
  ],

  instagram: [
    { img: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&q=80&fit=crop", handle: "@abudhabi.style" },
    { img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80&fit=crop", handle: "@doha.looks" },
    { img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80&fit=crop", handle: "@riyadh_fit" },
    { img: "https://images.unsplash.com/photo-1503341338985-95f13b926738?w=500&q=80&fit=crop", handle: "@dubai_menswear" },
    { img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80&fit=crop", handle: "@kuwait_style" },
    { img: "https://images.unsplash.com/photo-1542271026-7eec264c27ff?w=500&q=80&fit=crop", handle: "@bahrain.fits" },
  ],

  pages: {
    about: {
      en: "Premium streetwear for those who define their own path. Born in the Gulf, built for the world. We design pieces for the climate, the cities, and the nights of the GCC — cut clean, finished carefully, and made to last beyond a single season.",
      ar: "أزياء شارع فاخرة لمن يرسم طريقه بنفسه. وُلدت في الخليج، وصُممت للعالم. نصمم قطعاً تناسب مناخ مدن الخليج ولياليها — بقصّة نظيفة وتشطيب دقيق لتدوم أكثر من موسم واحد.",
    } satisfies Localized,
    privacy: {
      en: "We collect only the information needed to process orders, manage accounts, and send newsletters you opt into. We do not sell personal data. For questions, contact us through the contact page.",
      ar: "نجمع فقط المعلومات اللازمة لمعالجة الطلبات وإدارة الحسابات والنشرات التي تشترك فيها. لا نبيع البيانات الشخصية. للأسئلة تواصل معنا عبر صفحة الاتصال.",
    } satisfies Localized,
    terms: {
      en: "By placing an order you agree that items are sold as described, shipping times are estimates, and returns follow the 14-day policy on unworn goods with tags attached.",
      ar: "بتقديم الطلب توافق على وصف المنتجات، وأن أوقات الشحن تقديرية، وأن الإرجاع خلال 14 يوماً للقطع غير المستخدمة مع البطاقات.",
    } satisfies Localized,
  },

  faqs: [
    {
      q: { en: "What is your return policy?", ar: "ما هي سياسة الإرجاع؟" },
      a: { en: "14-day hassle-free returns on unworn items with tags attached.", ar: "إرجاع خلال 14 يوماً دون عناء للقطع غير المستخدمة مع البطاقات." },
    },
    {
      q: { en: "Do you ship across the GCC?", ar: "هل تشحنون في دول الخليج؟" },
      a: { en: "Yes. Free shipping on orders above the threshold to Qatar, UAE, KSA, Kuwait, Bahrain, and Oman.", ar: "نعم. شحن مجاني فوق الحد الأدنى إلى قطر والإمارات والسعودية والكويت والبحرين وعُمان." },
    },
    {
      q: { en: "How do I track my order?", ar: "كيف أتتبع طلبي؟" },
      a: { en: "You will receive a tracking update by email once your order ships. You can also view status in My Account.", ar: "يصلك تحديث بالبريد عند الشحن، ويمكنك متابعة الحالة من حسابك." },
    },
    {
      q: { en: "What currency do you charge in?", ar: "بأي عملة يتم الدفع؟" },
      a: { en: "All prices are in the store currency shown at checkout.", ar: "جميع الأسعار بعملة المتجر الظاهرة عند الدفع." },
    },
  ],

  categoryNames: {
    "t-shirts": { en: "T-Shirts", ar: "تيشيرتات" },
    shirts: { en: "Shirts", ar: "قمصان" },
    joggers: { en: "Joggers", ar: "جوغر" },
    shorts: { en: "Shorts", ar: "شورتات" },
    hoodies: { en: "Hoodies", ar: "هوديز" },
    activewear: { en: "Activewear", ar: "ملابس رياضية" },
    accessories: { en: "Accessories", ar: "إكسسوارات" },
    "new-arrivals": { en: "New Arrivals", ar: "وصل حديثاً" },
  } satisfies Record<string, Localized>,
};

export function loc(value: Localized, locale: Locale): string {
  return value[locale] || value.en;
}

export function themeCss(): string {
  const toVars = (palette: typeof theme.colors.light) =>
    [
      `--gold:${palette.accent}`,
      `--gold-light:${palette.accentLight}`,
      `--gold-dark:${palette.accentDark}`,
      `--black:${palette.text}`,
      `--warm-white:${palette.bg}`,
      `--off-white:${palette.bgAlt}`,
      `--sand:${palette.border}`,
      `--muted:${palette.muted}`,
      `--surface:${palette.surface}`,
      `--sale:${palette.sale}`,
      `--footer:${palette.footer}`,
      `--nav-solid:${palette.navSolid}`,
      `--accent-ink:${palette.accentDark === "#8B6914" ? "#0D0D0D" : "#0D0D0D"}`,
    ].join(";");

  return `:root{${toVars(theme.colors.light)}}[data-theme="dark"]{${toVars(theme.colors.dark)}}`;
}
