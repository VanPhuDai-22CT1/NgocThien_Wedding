import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "utils/apiClient";
import logo from "assets/users/images/icondau/logodvkv.png";
import nen from "assets/users/images/nen/nendn.jpg";
import "./style.scss";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validate
    if (!username.trim()) {
      setErrorMessage("Vui lòng nhập tên người dùng");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Email không hợp lệ");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu không khớp");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại");
      return;
    }

    if (!address.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ");
      return;
    }

    try {
      const response = await apiClient.post("/auth/register", {
        username,
        email,
        password,
        confirmPassword,
        phone,
        address,
      });

      const data = response.data || {};

      if (data.success) {
        setSuccessMessage("Đăng ký thành công! Đang chuyển sang đăng nhập...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setErrorMessage(data.message || "Đăng ký thất bại");
      }
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Không kết nối được backend");
    }
  };

  return (
    <div
      className="registerpage"
      style={{ backgroundImage: `url(${nen})` }}
    >
      <div className="register-form">
        <form className="login-form" onSubmit={handleSubmit}>

          <div className="login-image">
            <img src={logo} alt="Logo dịch vụ" />
          </div>

          <h1>Đăng ký</h1>

          <input
            className="b"
            type="text"
            placeholder="Tên người dùng"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="b"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="b"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="b"
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <input
            className="b"
            type="text"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="b"
            type="text"
            placeholder="Địa chỉ"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <button type="submit" className="btn-register">
            Đăng ký
          </button>

          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          <p>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
