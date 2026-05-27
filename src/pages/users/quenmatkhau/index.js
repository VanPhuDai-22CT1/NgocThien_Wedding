import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.scss";

import nen from "assets/users/images/nen/nendn.jpg";
import logo from "assets/users/images/icondau/logodvkv.png";

const QuenMatKhauStandalone = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: nhập email | 2: nhập OTP
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ======================
  // Gửi OTP
  // ======================
  const sendOtp = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:4000/api/legacy",
        {
          action: "forgotPassword",
          email,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.data?.success) {
        alert("OTP đã được gửi về email");
        localStorage.setItem("reset_email", email);
        setStep(2); // Chuyển sang nhập OTP
      } else {
        alert(res.data?.message || "Gửi mã thất bại");
      }
    } catch (err) {
      alert("Không kết nối được server");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // Xác minh OTP
  // ======================
  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      alert("Vui lòng nhập OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:4000/api/legacy",
        {
          action: "verifyOtp",
          email,
          otp,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.data?.success) {
        alert("OTP hợp lệ");
        navigate("/datlaimatkhau"); // OTP đúng -> đổi mật khẩu
      } else {
        alert(res.data?.message || "OTP không đúng");
      }
    } catch (err) {
      alert("Không kết nối được server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="forgot-page"
      style={{ backgroundImage: `url(${nen})` }}
    >
      <div className="forgot-box">
        <img src={logo} alt="Logo" className="forgot-logo" />

        <h2>Quên mật khẩu</h2>

        {/* ===== BƯỚC 1: NHẬP EMAIL ===== */}
        {step === 1 && (
          <form onSubmit={sendOtp}>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi mã xác nhận"}
            </button>
          </form>
        )}

        {/* ===== BƯỚC 2: NHẬP OTP ===== */}
        {step === 2 && (
          <form onSubmit={verifyOtp}>
            <input
              type="text"
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Đang kiểm tra..." : "Xác nhận OTP"}
            </button>
          </form>
        )}

        <button
          className="back-btn"
          onClick={() => navigate("/login")}
          disabled={loading}
        >
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  );
};

export default QuenMatKhauStandalone;

