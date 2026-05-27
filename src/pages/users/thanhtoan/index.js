import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaMoneyBillWave, FaQrcode, FaCheckCircle } from "react-icons/fa";
import { getAuthItem } from "utils/authStorage";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import "./style.scss";

const BANK_BIN = process.env.REACT_APP_BANK_BIN || "970423";
const BANK_ACCOUNT = process.env.REACT_APP_BANK_ACCOUNT || "24122004079";
const BANK_ACCOUNT_NAME = process.env.REACT_APP_BANK_ACCOUNT_NAME || "VAN PHU DAI";
const ONLINE_DEPOSIT_RATE = 0.1;

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ThanhToan = () => {
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [bookingForm, setBookingForm] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const userId = getAuthItem("user_id");
  const minEventDate = (() => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    return formatDateInput(minDate);
  })();

  useEffect(() => {
    if (!userId) {
      alert("Vui lòng đăng nhập để tiếp tục thanh toán. Nhấn OK để chuyển sang trang đăng nhập.");
      navigate("/login");
      return;
    }

    if (location.state?.bookingForm) {
      setBookingForm(location.state.bookingForm);
    }

    if (location.state?.cartItems && Array.isArray(location.state.cartItems)) {
      setCartItems(location.state.cartItems);
      return;
    }

    apiClient
      .get("/cart", {
        params: { userid: userId },
      })
      .then((res) => {
        if (res.data?.success) {
          setCartItems(res.data.data || []);
        }
      })
      .catch(() => {});
  }, [userId, location.state, navigate]);

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
    [cartItems]
  );

  const onlineDepositAmount = useMemo(
    () => Math.max(0, Math.round((Number(total) || 0) * ONLINE_DEPOSIT_RATE)),
    [total]
  );

  const amountToPay = method === "bank" ? onlineDepositAmount : total;

  const transferContent = useMemo(() => {
    const rawName = String(bookingForm?.name || "KHACH").replace(/\s+/g, "").slice(0, 12);
    return `NTW ${rawName} ${bookingForm?.eventDate || ""}`.trim();
  }, [bookingForm]);

  const qrImageUrl = useMemo(() => {
    const amount = Math.max(0, Math.round(Number(amountToPay) || 0));
    const base = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact2.png`;
    const params = new URLSearchParams({
      amount: String(amount),
      addInfo: transferContent,
      accountName: BANK_ACCOUNT_NAME,
    });
    return `${base}?${params.toString()}`;
  }, [amountToPay, transferContent]);

  const paymentLabel = method === "cash"
    ? "Thanh toán khi gặp trực tiếp"
    : "Đặt cọc online 10%";

  const handlePayment = async () => {
    if (!userId) {
      alert("⚠️ Bạn chưa đăng nhập");
      return;
    }

    if (!bookingForm?.name || !bookingForm?.phone || !bookingForm?.eventDate) {
      alert("Thiếu thông tin đặt dịch vụ. Vui lòng quay lại bước trước.");
      return;
    }

    if (bookingForm.eventDate < minEventDate) {
      alert("Ngày cưới phải cách ngày hiện tại ít nhất 2 ngày.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Giỏ dịch vụ đang trống");
      return;
    }

    try {
      setLoading(true);

      const orderItems = cartItems.map((item) => ({
        product_id: Number(item.productId || item.product_id || item.id),
        quantity: Number(item.quantity || 1),
      }));

      const res = await apiClient.post(
        "/orders",
        {
          user_id: Number(userId),
          items: orderItems,
          payment_method: method,
          delivery_address: bookingForm.location,
          phone: bookingForm.phone,
          email: bookingForm.email,
          note: `Wedding date: ${bookingForm.eventDate || ""}. ${bookingForm.note || ""}`,
        },
        {
          headers: buildAuthHeaders(),
        }
      );

      if (res.data.success) {
        const orderId = res.data?.data?.order_id;
        const orderTime = new Date().toLocaleString("vi-VN");

        if (userId) {
          try {
            await apiClient.delete(`/cart/user/${userId}`, { headers: buildAuthHeaders() });
          } catch (error) {
            console.error("Clear cart error:", error);
          }
        }

        navigate(`/hoadon/${orderId}`, {
          state: {
            orderNotice: {
              orderId,
              orderTime,
              status: "Đang xử lý",
              message: "Đặt dịch vụ thành công. Chúng tôi sẽ liên hệ lại sớm nhất."
            }
          }
        });
      } else {
        alert(res.data.message || "Thanh toán thất bại");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-wrapper">
      <div className="payment-card">
        <h2>Xác nhận đặt dịch vụ & thanh toán</h2>
        <p className="payment-subtitle">Ngọc Thiện Wedding • Hoàn tất thông tin trước khi chốt lịch</p>

        <div className="payment-summary-grid">
          {bookingForm ? (
            <div className="confirm-box">
              <FaCheckCircle className="confirm-icon" />
              <h3>Thông tin khách hàng</h3>
              <div className="info-list">
                <p><strong>Họ tên:</strong> <span>{bookingForm.name}</span></p>
                <p><strong>Số điện thoại:</strong> <span>{bookingForm.phone}</span></p>
                <p><strong>Email:</strong> <span>{bookingForm.email || "-"}</span></p>
                <p><strong>Ngày cưới dự kiến:</strong> <span>{bookingForm.eventDate}</span></p>
                <p><strong>Địa điểm tổ chức:</strong> <span>{bookingForm.location || "-"}</span></p>
                <p><strong>Ghi chú:</strong> <span>{bookingForm.note || "-"}</span></p>
              </div>
            </div>
          ) : (
            <div className="confirm-box">
              <h3>Thông tin khách hàng</h3>
              <p>Không có dữ liệu đặt dịch vụ. Vui lòng quay lại bước trước.</p>
            </div>
          )}

          <div className="confirm-box">
            <h3>Danh sách dịch vụ đã chọn</h3>
            {cartItems.length === 0 ? (
              <p>Giỏ dịch vụ đang trống.</p>
            ) : (
              <>
                <div className="service-list">
                  {cartItems.map((item) => (
                    <div className="service-item" key={item.id}>
                      <span className="service-name">{item.name}</span>
                      <span className="service-meta">× {item.quantity} — {(Number(item.price) * Number(item.quantity)).toLocaleString()} VNĐ</span>
                    </div>
                  ))}
                </div>
                <p className="total-price"><strong>Tổng tiền:</strong> {total.toLocaleString()} VNĐ</p>
                {method === "bank" && (
                  <p className="deposit-price">
                    <strong>Cần thanh toán online (10%):</strong> {onlineDepositAmount.toLocaleString()} VNĐ
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="payment-options">
          <label className={method === "cash" ? "active" : ""}>
            <input
              type="radio"
              value="cash"
              checked={method === "cash"}
              onChange={() => setMethod("cash")}
            />
            <FaMoneyBillWave className="pay-icon" />
            <div>
              <strong>Thanh toán khi gặp trực tiếp</strong>
              <p>Thanh toán khi nhân viên đến tư vấn/chốt đơn</p>
            </div>
          </label>

          <label className={method === "bank" ? "active" : ""}>
            <input
              type="radio"
              value="bank"
              checked={method === "bank"}
              onChange={() => setMethod("bank")}
            />
            <FaQrcode className="pay-icon" />
            <div>
              <strong>Thanh toán chuyển khoản</strong>
              <p>Chỉ thanh toán cọc 10% giá trị đơn khi đặt online</p>
            </div>
          </label>
        </div>

        {method === "bank" && (
          <div className="qr-box">
            <h3>Mã QR chuyển khoản tự động</h3>
            <p className="qr-note">
              Quét mã bằng app ngân hàng để chuyển khoản tiền cọc 10%. Phần còn lại thanh toán sau.
            </p>
            <div className="qr-content">
              <img src={qrImageUrl} alt="QR chuyển khoản" className="qr-image" />
              <div className="qr-meta">
                <p><strong>Ngân hàng (BIN):</strong> {BANK_BIN}</p>
                <p><strong>Số tài khoản:</strong> {BANK_ACCOUNT}</p>
                <p><strong>Chủ tài khoản:</strong> {BANK_ACCOUNT_NAME}</p>
                <p><strong>Tổng giá trị đơn:</strong> {total.toLocaleString()} VNĐ</p>
                <p><strong>Số tiền cọc (10%):</strong> {onlineDepositAmount.toLocaleString()} VNĐ</p>
                <p><strong>Còn lại khi chốt đơn:</strong> {(Math.max(0, total - onlineDepositAmount)).toLocaleString()} VNĐ</p>
                <p><strong>Nội dung:</strong> {transferContent}</p>
              </div>
            </div>
          </div>
        )}

        <div className="confirm-actions">
          <button className="btn-outline" onClick={() => navigate("/dathang", { state: { bookingForm, cartItems } })} disabled={loading}>
            Chỉnh sửa
          </button>

          <button className="btn-main" onClick={handlePayment} disabled={loading || cartItems.length === 0 || !bookingForm}>
            {loading ? "Đang xử lý..." : `Xác nhận đặt dịch vụ (${paymentLabel})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThanhToan;