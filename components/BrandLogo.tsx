import { theme } from "@/theme.config";

const HEIGHTS = {
  nav: 42,
  footer: 56,
  admin: 38,
  splash: 108,
} as const;

export default function BrandLogo({
  size = "nav",
  className,
}: {
  size?: keyof typeof HEIGHTS;
  className?: string;
}) {
  const height = HEIGHTS[size];
  return (
    <img
      src="/logo.png?v=2"
      alt={theme.brand.name}
      height={height}
      className={`brand-logo${className ? ` ${className}` : ""}`}
      style={{ height, width: "auto", display: "block" }}
    />
  );
}
