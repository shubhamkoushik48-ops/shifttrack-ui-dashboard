"use client";

import axios, { type AxiosInstance } from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem("shifttrack.session");

    if (raw) {
      try {
        const session = JSON.parse(raw) as {
          accessToken?: string;
        };

        if (session.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      } catch {
        // ignore malformed session storage
      }
    }
  }

  return config;
});

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string }
      | undefined;

    return data?.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}