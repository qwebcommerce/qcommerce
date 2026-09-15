import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "qc_admin";
const CUSTOMER_COOKIE = "qc_customer";

function safeCustomerNext(value: string | null | undefined) {
  const next = (value ?? "").trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return "/account";
  if (next === "/admin" || next.startsWith("/admin/")) return "/account";
  if (next.startsWith("/account/login") || next.startsWith("/account/register")) return "/account";
  return next;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);
  const isCustomer = Boolean(request.cookies.get(CUSTOMER_COOKIE)?.value);

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (isAdmin) return NextResponse.redirect(new URL("/admin", request.url));
      return NextResponse.next();
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    const isAuthPage = pathname === "/account/login" || pathname === "/account/register";
    if (isAuthPage) {
      if (isCustomer) {
        const dest = safeCustomerNext(request.nextUrl.searchParams.get("next"));
        return NextResponse.redirect(new URL(dest, request.url));
      }
      return NextResponse.next();
    }
    if (!isCustomer) {
      const login = new URL("/account/login", request.url);
      if (pathname !== "/account") login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
