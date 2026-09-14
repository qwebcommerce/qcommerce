import { cookies } from "next/headers";
import { hashPassword } from "@/lib/password";
import { getCustomerByEmail } from "@/lib/db";
import type { Customer } from "@/types";

const ADMIN_COOKIE = "qc_admin";
const CUSTOMER_COOKIE = "qc_customer";

export type CustomerSession = {
  id: string;
  email: string;
  fullName: string;
};

export function adminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@voombaza.com",
    password: process.env.ADMIN_PASSWORD || "admin123",
  };
}

export async function setAdminSession(email: string) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<string | null> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value ?? null;
}

export async function requireAdmin(): Promise<string> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function setCustomerSession(customer: CustomerSession) {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, JSON.stringify(customer), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const raw = store.get(CUSTOMER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerSession;
  } catch {
    return null;
  }
}

export function safeNextPath(value: string | null | undefined, fallback = "/account") {
  const next = (value ?? "").trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return fallback;
  return next;
}

export async function authenticateCustomer(email: string, password: string): Promise<Customer> {
  const customer = await getCustomerByEmail(email);
  if (!customer || customer.passwordHash !== hashPassword(password)) {
    throw new Error("Invalid email or password");
  }
  return customer;
}
