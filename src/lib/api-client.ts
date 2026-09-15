"use client";

import axios, {
  type AxiosInstance,
  type AxiosResponse,
} from "axios";
import { mockRequest } from "@/mock/api";
import { ApiError } from "@/mock/api-error";

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

/**
 * Offline resilience: the real backend (NEXT_PUBLIC_API_URL) is always tried
 * first. If it is unreachable — or returns 404 for an endpoint it has not
 * implemented — the request is transparently served by the built-in mock
 * backend so the app keeps working during development. Any other real HTTP
 * error status (401, 403, 400, 500, …) still surfaces unchanged.
 */
http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || axios.isCancel(error)) throw error;

    const config = error.config;
    if (!config) throw error;

    const unreachable = !error.response; // refused / timeout / CORS-blocked
    const notImplemented = error.response?.status === 404;
    if (!unreachable && !notImplemented) throw error;

    const method = (config.method ?? "get").toUpperCase() as
      | "GET"
      | "POST"
      | "PATCH"
      | "DELETE";
    const raw = config.url ?? "/";
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    const params = config.params as Record<string, unknown> | undefined;
    const qs = params
      ? new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ).toString()
      : "";
    const url = qs ? `${path}?${qs}` : path;

    try {
      const body = config.data ? JSON.parse(String(config.data)) : undefined;
      const data = await mockRequest(method, url, body);

      console.info(
        `[api] backend unavailable — mock served ${method} ${path}`,
      );

      const response: AxiosResponse = {
        data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: undefined,
      };
      return response;
    } catch (mockError) {
      if (mockError instanceof ApiError) {
        // The mock recognized the route but rejected it (e.g. duplicate email
        // → 409). Convert it into a real axios-style error response so the UI
        // shows the proper message instead of "Network Error".
        const axiosError = new axios.AxiosError(
          mockError.message,
          String(mockError.status),
          config,
          undefined,
          {
            data: { message: mockError.message },
            status: mockError.status,
            statusText: mockError.message,
            headers: {},
            config,
          } as AxiosResponse,
        );
        throw axiosError;
      }
      // Mock could not handle it either — surface the original failure.
      throw error;
    }
  },
);

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