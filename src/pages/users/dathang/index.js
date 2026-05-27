import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuthItem } from "utils/authStorage";
import { getGuestCart } from "utils/guestCart";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import "./style.scss";

const DatDichVu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = getAuthItem("user_id");

  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dateStatus, setDateStatus] = useState(null);
  const [dateRemaining, setDateRemaining] = useState(2);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    location: "",
    note: "",
  });

  useEffect(() => {
    if (userId) {
      apiClient
        .get("/cart", {
          params: { userid: userId },
        })
        .then((res) => {
          if (res.data?.success) {
            setCart(res.data.data || []);
          }
        })
        .catch(() => {});

      apiClient
        .get("/auth/me", { headers: buildAuthHeaders() })
        .then((res) => {
          if (res.data?.success) {
            const user = res.data.data || {};
            setFormData((prev) => ({
              ...prev,
              name: user.username || "",
              email: user.email || "",
              phone: user.phone || "",
              location: user.address || "",
            }));
          }
        })
        .catch(() => {});

      return;
    }

    setCart(getGuestCart());
  }, [userId]);

  useEffect(() => {
    if (location.state?.cartItems && Array.isArray(location.state.cartItems)) {
      setCart(location.state.cartItems);
    }

    if (location.state?.bookingForm) {
      setFormData((prev) => ({
        ...prev,
        ...location.state.bookingForm,
      }));
    }
  }, [location.state]);

  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const minEventDate = (() => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    return formatDateInput(minDate);
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

    const checkDate = async (date) => {
      if (!date) { setDateStatus(null); return; }
      setDateStatus("checking");
      try {
        const res = await apiClient.get("/consultations/booked-dates");
        if (res.data?.success) {
          const bookedDates = Array.isArray(res.data.data) ? res.data.data : [];
          const normalizedDate = String(date).slice(0, 10);
          const usedCount = bookedDates.filter(
            (item) => String(item).slice(0, 10) === normalizedDate
          ).length;
          const remaining = Math.max(0, 2 - usedCount);
          setDateRemaining(remaining);
          setDateStatus(remaining > 0 ? "available" : "full");
        } else {
          setDateStatus(null);
        }
      } catch {
        setDateStatus(null);
      }
    };

    const handleContinue = () => {
    if (!formData.name || !formData.phone || !formData.eventDate) {
      alert("Vui lòng nhập đầy đủ Họ tên, SĐT và Ngày cưới dự kiến");
      return;
    }

    if (formData.eventDate < minEventDate) {
      alert("Ngày cưới phải cách ngày hiện tại ít nhất 2 ngày.");
      return;
    }

      if (dateStatus === "full") {
        alert("Ngày này đã đủ 2 tiệc cưới, vui lòng chọn ngày khác.");
        return;
      }

      if (cart.length === 0) {
      alert("Giỏ dịch vụ đang trống");
      return;
    }

    setSubmitting(true);
    navigate("/thanhtoan", {
      state: {
        bookingForm: formData,
        cartItems: cart,
      },
    });
  };

  const total = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  return (
    <div className="order-wrapper">
      <div className="order-container">
        <div className="order-card">
          <h2>📦 Thông tin đặt dịch vụ</h2>

          {cart.length === 0 ? (
            <div className="order-list">
              <p>Giỏ dịch vụ đang trống.</p>
              <button className="btn-confirm" onClick={() => navigate("/sanpham")}>Tiếp tục chọn dịch vụ</button>
            </div>
          ) : (
            <>
              <div className="order-list">
                {cart.map((item) => (
                  <div className="order-item" key={item.id}>
                    <div className="item-info">
                      <span className="name">{item.name}</span>
                      <span className="qty">Số lượng: {item.quantity}</span>
                    </div>
                    <div className="item-price">{(item.price * item.quantity).toLocaleString()} VNĐ</div>
                  </div>
                ))}
              </div>

              <div className="order-total">
                <span>Tổng tiền tạm tính</span>
                <strong>{total.toLocaleString()} VNĐ</strong>
              </div>

              <div className="order-form">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Họ và tên *" />
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Số điện thoại *" />
                  <input name="eventDate" type="date" min={minEventDate} value={formData.eventDate} onChange={(e) => { handleChange(e); checkDate(e.target.value); }} />
                  {dateStatus === "checking" && <p className="date-hint checking">⏳ Đang kiểm tra ngày...</p>}
                  {dateStatus === "available" && <p className="date-hint available">✅ Ngày này còn nhận ({dateRemaining} suất)</p>}
                  {dateStatus === "full" && <p className="date-hint full">🚫 Ngày {formData.eventDate} đã đủ 2 tiệc cưới, vui lòng chọn ngày khác</p>}
                <input name="location" value={formData.location} onChange={handleChange} placeholder="Địa điểm tổ chức" />
                <textarea name="note" rows="3" value={formData.note} onChange={handleChange} placeholder="Ghi chú yêu cầu" />
              </div>

              <button className="btn-confirm" onClick={handleContinue} disabled={submitting || dateStatus === "full"}>
                Xác nhận thông tin & chọn thanh toán
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatDichVu;
