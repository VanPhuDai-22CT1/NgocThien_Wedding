import axios from "axios";
import { apiClient, buildAuthHeaders } from "utils/apiClient";

const GUEST_CART_KEY = "guest_cart_items";

const hasWindow = () => typeof window !== "undefined";

const normalizeItem = (item = {}) => {
  const productId = Number(item.productId ?? item.id ?? 0);
  const quantity = Math.max(1, Number(item.quantity || 1));

  return {
    productId,
    id: productId,
    name: item.name || "Sản phẩm",
    price: Number(item.price || 0),
    quantity,
    cover: item.cover || "",
  };
};

export const getGuestCart = () => {
  if (!hasWindow()) return [];

  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    const parsed = JSON.parse(raw || "[]");

    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem).filter((item) => item.productId > 0);
  } catch (error) {
    return [];
  }
};

export const saveGuestCart = (items = []) => {
  if (!hasWindow()) return;
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const addGuestCartItem = (item, quantity = 1) => {
  const cart = getGuestCart();
  const normalizedItem = normalizeItem({ ...item, quantity });

  if (!normalizedItem.productId) {
    return cart;
  }

  const existedIndex = cart.findIndex(
    (cartItem) => Number(cartItem.productId) === Number(normalizedItem.productId)
  );

  if (existedIndex >= 0) {
    cart[existedIndex] = {
      ...cart[existedIndex],
      quantity: Number(cart[existedIndex].quantity || 1) + Number(quantity || 1),
    };
  } else {
    cart.push(normalizedItem);
  }

  saveGuestCart(cart);
  return cart;
};

export const removeGuestCartItem = (productId) => {
  const nextCart = getGuestCart().filter(
    (item) => Number(item.productId) !== Number(productId)
  );
  saveGuestCart(nextCart);
  return nextCart;
};

export const clearGuestCart = () => {
  if (!hasWindow()) return;
  window.localStorage.removeItem(GUEST_CART_KEY);
};

export const mergeGuestCartToServer = async (userId) => {
  const cart = getGuestCart();
  const normalizedUserId = Number(userId || 0);

  if (!normalizedUserId || cart.length === 0) {
    return;
  }

  await Promise.all(
    cart.map((item) =>
      apiClient.post(
        "/cart",
        {
          userid: normalizedUserId,
          productId: Number(item.productId),
          quantity: Number(item.quantity || 1),
        },
        { headers: buildAuthHeaders() }
      )
    )
  );

  clearGuestCart();
};
