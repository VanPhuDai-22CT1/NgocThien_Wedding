import axios from "axios";
import { getAuthItem } from "utils/authStorage";

const normalizeApiBaseUrl = (rawUrl) => {
  const fallback = "http://localhost:4000/api";
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

export const buildAuthHeaders = () => {
  const token = getAuthItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};
