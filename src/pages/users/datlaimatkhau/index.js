import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";
import nen from "assets/users/images/nen/nendn.jpg";
import logo from "assets/users/images/icondau/logodvkv.png";

const DatLaiMatKhau = () => {
  const [email, setEmail] = useState("");
  const [matkhau, setMatkhau] = useState("");
  const [nhaplai, setNhapLai] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("reset_email");
    if (!savedEmail) navigate("/quenmatkhau");
    setEmail(savedEmail);
  }, [navigate]);

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (matkhau.length < 6) {
    alert("Mật khẩu phải từ 6 ký tự");
    return;
  }

  if (matkhau !== nhaplai) {
    alert("Mật khẩu không khớp");
    return;
  }

  try {
    const res = await fetch(
      "http://localhost:4000/api/legacy?action=reset_password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: matkhau }),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("Đặt lại mật khẩu thành công");
      localStorage.removeItem("reset_email");
      navigate("/login");
    } else {
      alert(data.message || "Lỗi đổi mật khẩu");
    }
  } catch (err) {
    alert("Không kết nối được server");
    console.error("Fetch error:", err);
  }
};


  return (
    <div className="login-page" style={{ backgroundImage: `url(${nen})` }}>
      <div className="login-form">
        <div className="login-image">
          <img src={logo} alt="Logo" />
        </div>

        <h2>Đặt lại mật khẩu</h2>

        <form onSubmit={handleSubmit}>
          <input type="email" value={email} disabled />

          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={matkhau}
            onChange={(e) => setMatkhau(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={nhaplai}
            onChange={(e) => setNhapLai(e.target.value)}
            required
          />

          <button type="submit">Xác nhận</button>
        </form>
        <button
        type="button"
        className="btn-home"
        onClick={() => navigate("/")}
      >
        Quay về trang chủ
      </button>
      </div>
    </div>
  );
};

export default DatLaiMatKhau;

