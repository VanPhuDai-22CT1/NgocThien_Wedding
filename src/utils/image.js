const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x400?text=No+Image";

const getBackendBaseUrl = () => {
  const envApi = process.env.REACT_APP_API_URL || "";
  const envBase = envApi.replace(/\/api\/?$/, "");

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:5000`;
    }
    return envBase || window.location.origin;
  }

  return envBase || "http://localhost:5000";
};

export const parseImageList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      // Some legacy rows store a single image name or comma-separated image names.
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const getProductImage = (product) => {
  if (!product) return "";
  const gallery = parseImageList(product.image_urls || product.images);
  return product.cover || gallery[0] || "";
};

export const getImageUrl = (img) => {
  if (!img) {
    return PLACEHOLDER_IMAGE;
  }

  if (Array.isArray(img)) {
    return getImageUrl(img[0]);
  }

  if (typeof img !== "string") {
    return PLACEHOLDER_IMAGE;
  }

  const rawImg = img.trim();
  if (!rawImg) {
    return PLACEHOLDER_IMAGE;
  }

  if (/^(https?:|data:|blob:)/i.test(rawImg)) {
    return rawImg;
  }

  if (rawImg.startsWith("/uploads/")) {
    return `${getBackendBaseUrl()}${rawImg}`;
  }

  if (rawImg.startsWith("uploads/")) {
    return `${getBackendBaseUrl()}/${rawImg}`;
  }

  if (rawImg.startsWith("/")) {
    return rawImg;
  }

  return `${getBackendBaseUrl()}/uploads/${rawImg}`;
};
