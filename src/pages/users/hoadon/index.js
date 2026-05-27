import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import "./style.scss";

const HoaDon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/orders/${id}`, {
          headers: buildAuthHeaders(),
        });
        const data = res.data || {};

        if (data.success) {
          const orderData = data.data || {};
          setOrder({
            order_id: orderData.id,
            order_time: orderData.created_at,
            customer_name: orderData.customer_name || "",
            phone: orderData.phone || "",
            address: orderData.delivery_address || "",
            payment_method: orderData.payment_method || "cash",
            status: orderData.status || "pending",
            total: Number(orderData.total_amount || 0),
          });

          const mappedDetails = Array.isArray(orderData.OrderItems)
            ? orderData.OrderItems.map((item) => ({
                product_name: item.Product?.name || "Sản phẩm",
                quantity: Number(item.quantity || 1),
                product_price: Number(item.price || 0),
              }))
            : [];
          setDetails(mappedDetails);
        } else {
          setError("Không tìm thấy hóa đơn.");
        }
      } catch (err) {
        setError("Lỗi kết nối server.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " đ";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getPaymentLabel = (method) => {
    const value = String(method || "").toLowerCase();
    if (value === "bank") return "Chuyển khoản";
    if (value === "cash") return "Tiền mặt";
    return method || "-";
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized.includes("nhận")) return "success";
    if (normalized.includes("giao") || normalized.includes("xử lý") || normalized.includes("xu ly")) return "processing";
    if (normalized.includes("hủy") || normalized.includes("huy")) return "cancel";
    return "pending";
  };

  return (
    <div className="invoice-wrapper">
      <div className="invoice">

        {loading && <div className="loading">Đang tải hóa đơn...</div>}

        {!loading && error && (
          <div className="error">{error}</div>
        )}

        {!loading && !error && order && (
          <>
            <div className="invoice-header">
              <div className="company">
                <h2>Ngọc Thiện Wedding</h2>
                <p>Địa chỉ: 72/2 Lê Cơ</p>
                <p>Hotline: 0367 234 139</p>
              </div>
              <div className="invoice-meta">
                <p><strong>Mã HĐ:</strong> #{order.order_id}</p>
                <p><strong>Ngày:</strong> {formatDate(order.order_time)}</p>
              </div>
            </div>

            <div className="invoice-title">
              <h1>HÓA ĐƠN THANH TOÁN</h1>
            </div>

            <div className="customer-info">
              <div>
                <p><strong>Khách hàng:</strong> <span>{order.customer_name}</span></p>
                <p><strong>SĐT:</strong> <span>{order.phone}</span></p>
                <p><strong>Địa chỉ:</strong> <span>{order.address}</span></p>
              </div>

              <div className="payment-status-box">
                <p className="payment-row"><strong>Phương thức:</strong> <span>{getPaymentLabel(order.payment_method)}</span></p>
                <div className="status-row">
                  <strong>Trạng thái:</strong>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {details.length > 0 ? (
                  details.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.product_price)}</td>
                      <td>
                        {formatMoney(
                          item.quantity * item.product_price
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Không có sản phẩm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="total-section">
              Tổng thanh toán:
              <span> {formatMoney(order.total)}</span>
            </div>

            <div className="invoice-actions">
              <button
                className="btn-back"
                onClick={() =>
                  navigate("/thongbao", {
                    state: {
                      orderNotice: location.state?.orderNotice,
                    },
                  })
                }
              >
                Quay lại
              </button>

              <button
                className="btn-print"
                onClick={() => window.print()}
              >
                In hóa đơn
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default HoaDon;