import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import RouterCustom from "./router";
import "./style/style.scss";
import { CartProvider } from 'pages/users/ketnoi/CartContext'; // Đảm bảo CartContext.js tồn tại trong src/context
import { hydrateAuthSessionFromLegacy } from "utils/authStorage";

// Tạo root cho ứng dụng
const root = ReactDOM.createRoot(document.getElementById("root"));

hydrateAuthSessionFromLegacy();

root.render(
    <CartProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <RouterCustom/>
        </BrowserRouter>
    </CartProvider>
);
