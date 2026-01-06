// src/lib/usersApi.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type ApiResp<T> = { message?: string; data?: T } & any;

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
    cache: "no-store",
  });

  const json: ApiResp<T> = await res.json().catch(() => ({} as any));

  if (!res.ok) {
    throw new Error(json?.message || "Request failed");
  }

  return (json?.data ?? json) as T;
}

export type MeUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

export async function meUser(): Promise<MeUser | null> {
  try {
    const data = await apiFetch<{ user: MeUser }>(`${API_BASE}/users/auth/me`, { method: "GET" });
    return data?.user || null;
  } catch {
    return null;
  }
}

export async function loginUser(email: string, password: string) {
  return apiFetch(`${API_BASE}/users/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutUser() {
  return apiFetch(`${API_BASE}/users/auth/logout`, { method: "POST", body: JSON.stringify({}) });
}

// OTP
export async function sendSignupOtp(email: string) {
  return apiFetch(`${API_BASE}/users/auth/send-otp`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifySignupOtp(email: string, otp: string) {
  return apiFetch(`${API_BASE}/users/auth/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function registerAfterOtp(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}) {
  return apiFetch(`${API_BASE}/users/auth/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
