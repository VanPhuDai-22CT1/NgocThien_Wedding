import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthSession } from "utils/authStorage";
import { mergeGuestCartToServer } from "utils/guestCart";
import { apiClient } from "utils/apiClient";
import "./style.scss";

import nen from "assets/users/images/nen/nendn.jpg";
import logo from "assets/users/images/icondau/logodvkv.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const userOrigin = process.env.REACT_APP_USER_URL || "http://localhost:3000";
  const adminOrigin = process.env.REACT_APP_ADMIN_URL || "http://localhost:3001";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const data = response.data || {};
      const payload = data.data || {};

      if (data.success) {
        const userId =
          payload.user_id ||
          payload.id ||
          data.user_id ||
          data.id;

        if (!userId) {
          setErrorMessage("Không nhận được user ID từ server!");
          return;
        }

        const normalizedUserId = String(userId).trim();
        const numericUserId = Number(normalizedUserId);

        setAuthSession({
          user_id: normalizedUserId,
          username: payload.username || "",
          email: payload.email || "",
          role: payload.role || "user",
          token: payload.token || "",
        });

        try {
          if (Number.isFinite(numericUserId) && numericUserId > 0) {
            await mergeGuestCartToServer(numericUserId);
          }
        } catch (error) {
          console.error("Merge guest cart error:", error);
        }

        alert("🎉 Đăng nhập thành công!");

        if (payload.role === "admin") {
          window.location.assign(`${adminOrigin}/dashboard`);
        } else {
          window.location.assign(`${userOrigin}/`);
        }
      } else {
        setErrorMessage(data.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      console.error("❌ LOGIN ERROR:", error);
      setErrorMessage(error?.response?.data?.message || "Không thể kết nối backend");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${nen})` }}
    >
      <div className="login-form">
        <div className="login-image">
          <img src={logo} alt="Logo dịch vụ" />
        </div>

        <h2>Đăng nhập</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <button
            type="button"
            className="btn-register"
            onClick={() => navigate("/dangky")}
          >
            Đăng ký
          </button>
        </form>

        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}

        <div className="bottom-links">
        <p
          className="back-home-text"
          onClick={() => navigate("/")}
        >
          Trở về trang chủ
        </p>

        <p
          className="forgot-password-text"
          onClick={() => navigate("/quenmatkhau")}
        >
          Quên mật khẩu
        </p>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;