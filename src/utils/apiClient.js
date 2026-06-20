import axios from "axios";
import { getAuthItem } from "utils/authStorage";

const normalizeApiBaseUrl = (rawUrl) => {
  const isLocalBrowser =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  if (isLocalBrowser) {
    return "http://localhost:5000/api";
  }

  const fallback = "http://localhost:5000/api";
  const value = String(rawUrl || "").trim();

  if (!value) return fallback;

  const cleaned = value.replace(/\/+$/, "");
  if (cleaned.toLowerCase().endsWith("/api")) {
    return cleaned;
  }

  return `${cleaned}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const headers = buildAuthHeaders();
  if (headers.Authorization) {
    config.headers = {
      ...(config.headers || {}),
      ...headers,
    };
  }

  return config;
});

export const buildAuthHeaders = () => {
  const token = getAuthItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};
