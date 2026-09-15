"use client";

import axios, { type AxiosInstance } from "axios";
import { mockRequest } from "@/mock/api";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

/**
 * Axios client with a mock adapter.
 *
 * In production: set NEXT_PUBLIC_API_URL and remove the adapter line below —
 * every service call then hits the real REST API unchanged.
 */
export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem("shifttrack.session");
    if (raw) {
      try {
        const session = JSON.parse(raw) as { accessToken?: string };
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

http.defaults.adapter = async (config) => {
  const method = (config.method ?? "get").toUpperCase() as "GET" | "POST" | "PATCH" | "DELETE";
  const fullUrl = axios.getUri(config);
  // Strip the baseURL so the mock router sees clean paths like "/auth/login"
  const url = fullUrl.startsWith(API_BASE) ? fullUrl.slice(API_BASE.length) : fullUrl;
  try {
    const data = mockRequest(method, url, config.data ? JSON.parse(String(config.data)) : undefined);
    const result = await (data instanceof Promise ? data : Promise.resolve(data));
    return {
    data: result,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
    request: {},
    };
  } catch (err) {
    console.error("[api] mock adapter ✗", method, url, err);
    throw err;
  }
};

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
