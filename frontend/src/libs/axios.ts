import axios from "axios";
import { ACCESS_TOKEN_STORAGE_KEY, clearStoredSession } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api");

export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

export const normalizeUploadUrl = (value?: unknown) => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(url)) return url;
  if (/^\/?uploads\//i.test(url)) return `${API_ORIGIN}/${url.replace(/^\/+/, "")}`;
  return url;
};

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const refreshedToken = response.headers["x-access-token"];
    if (typeof refreshedToken === "string" && refreshedToken) {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, refreshedToken);
    }
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearStoredSession();
    }
    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

export const getApiErrorStatus = (error: unknown): number | undefined =>
  axios.isAxiosError(error) ? error.response?.status : undefined;

export default api;
