import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import RouterCustom from "./router";
import "./style/style.scss";
import { CartProvider } from 'pages/users/ketnoi/CartContext'; // Đảm bảo CartContext.js tồn tại trong src/context
import { buildAuthHeaders } from "utils/apiClient";
import { hydrateAuthSessionFromLegacy, hydrateAuthSessionFromWindowName } from "utils/authStorage";

const isAdminPort = ["3001", "3002"].includes(window.location.port);
document.title = isAdminPort
    ? "Admin - Ngoc Thien Wedding"
    : "Khach hang - Ngoc Thien Wedding";

// Tạo root cho ứng dụng
const root = ReactDOM.createRoot(document.getElementById("root"));

hydrateAuthSessionFromWindowName();
hydrateAuthSessionFromLegacy();

axios.interceptors.request.use((config) => {
    const headers = buildAuthHeaders();
    if (headers.Authorization) {
        config.headers = {
            ...(config.headers || {}),
            ...headers,
        };
    }

    return config;
});

root.render(
    <CartProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <RouterCustom/>
        </BrowserRouter>
    </CartProvider>
);
