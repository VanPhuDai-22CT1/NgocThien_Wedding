import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getAuthItem } from "utils/authStorage";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import "./style.scss";

const STATUS_OPTIONS = [
  "Đang xử lý",
  "Đang giao",
  "Đã bàn giao sự kiện",
  "Hủy đơn",
];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " VNĐ";

const formatDate = (date) =>
  date ? new Date(date).toLocaleString("vi-VN") : "N/A";

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "pending") return "Đang xử lý";
  if (value === "processing") return "Đang xử lý";
  if (value === "shipping") return "Đang giao";
  if (value === "delivered") return "Đã bàn giao sự kiện";
  if (value === "cancelled") return "Hủy đơn";
  if (value === "confirmed") return "Đã xác nhận";
  return status || "Đang xử lý";
};

// Parse dịch vụ từ note khi đơn không có order_details (đơn từ tư vấn)
const parseServicesFromNote = (note) => {
  if (!note) return [];
  // Ưu tiên "Danh sách gói đã chọn: ..."
  const match1 = note.match(/Danh sách gói đã chọn:\s*([^\n]+)/);
  if (match1) return match1[1].split(",").map((s) => s.trim()).filter(Boolean);
  // Fallback: "Dịch vụ: ..."
  const match2 = note.match(/Dịch vụ:\s*([^|]+)/);
  if (match2) return match2[1].split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

const Receipt = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  const isAdmin = getAuthItem("role") === "admin";
  const userId = Number(getAuthItem("user_id"));

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setMessage("Vui lòng đăng nhập để xem đơn hàng.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get(`/orders/user/${userId}`, {
        headers: buildAuthHeaders(),
      });

      console.log("📦 Orders response:", res.data);

      if (res.data.success) {
        const normalizedOrders = (res.data.orders || []).map((order) => {
          const details = Array.isArray(order.OrderItems)
            ? order.OrderItems.map((item) => ({
                product_name: item.Product?.name || "Sản phẩm",
                product_price: Number(item.price || 0),
                quantity: Number(item.quantity || 1),
              }))
            : [];

          return {
            order_id: order.id,
            created_at: order.created_at,
            total: Number(order.total_amount || 0),
            status: normalizeStatus(order.status),
            customer_name: order.customer_name || "",
            phone: order.phone || "",
            address: order.delivery_address || "",
            payment_method: order.payment_method || "cash",
            note: order.note || "",
            details,
          };
        });

        setOrders(normalizedOrders);
        setMessage(
          normalizedOrders.length === 0
            ? "Không có đơn hàng nào."
            : ""
        );
      } else {
        setOrders([]);
        setMessage(res.data.message || "Không có đơn hàng.");
      }
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      setMessage("Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Close modal on Escape key
  useEffect(() => {
    if (!selectedOrder) return;
    const onKey = (e) => { if (e.key === "Escape") setSelectedOrder(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedOrder]);

  const handleOpenDetail = (order) => setSelectedOrder(order);
  const handleCloseDetail = () => setSelectedOrder(null);

  const updateStatus = async (orderId) => {
    const newStatus = statusMap[orderId];
    if (!newStatus) return;

    try {
      const statusMapping = {
        "Đang xử lý": "processing",
        "Đang giao": "shipping",
        "Đã bàn giao sự kiện": "delivered",
        "Hủy đơn": "cancelled",
      };

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/orders/${orderId}/status`,
        {
          status: statusMapping[newStatus] || "processing",
        },
        { headers: buildAuthHeaders() }
      );

      if (res.data.success) {
        // Sync updated status into selectedOrder so modal reflects change
        setSelectedOrder((prev) =>
          prev && prev.order_id === orderId
            ? { ...prev, status: newStatus }
            : prev
        );
        await fetchOrders();
        setStatusMap((prev) => ({ ...prev, [orderId]: "" }));
      } else {
        alert(res.data.message || "Cập nhật thất bại.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi hệ thống.");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Đã nhận hàng":
      case "Đã giao sự kiện":
      case "Đã bàn giao sự kiện":   return "status success";
      case "Đang giao":              return "status delivering";
      case "Đang xử lý":             return "status processing";
      case "Hủy đơn":
      case "Đã bị hủy bởi admin":   return "status cancel";
      default: break;
    }
    const n = String(status || "").trim().toLowerCase();
    if (n === "đang giao"  || n === "dang giao")   return "status delivering";
    if (n === "đang xử lý" || n === "dang xu ly")  return "status processing";
    if (n === "đã giao sự kiện" || n === "da giao su kien") return "status success";
    if (n === "đã bàn giao sự kiện" || n === "da ban giao su kien") return "status success";
    if (n.includes("hủy")  || n === "cancelled")   return "status cancel";
    return "status pending";
  };

  if (loading) {
    return (
      <div className="receipt-page">
        <h2>Danh sách đơn hàng</h2>
        <p className="loading">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const orderList = Array.isArray(orders) ? orders : [];

  return (
    <div className="receipt-page">
      <h2>📦 Đơn hàng của tôi</h2>

      {orderList.length === 0 ? (
        <p className="empty">{message || "Chưa có đơn hàng nào. Hãy mua sắm ngay! 🛍️"}</p>
      ) : (
        <div className="receipt-list">
          {orderList.map((order) => (
            <div
              key={order.order_id}
              className="receipt-card"
              onClick={() => handleOpenDetail(order)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleOpenDetail(order)}
              title="Bấm để xem chi tiết"
            >
              <div className="receipt-summary">
                <div>
                  <p><strong>Mã đơn:</strong> #{order.order_id}</p>
                  <p><strong>Ngày:</strong> {formatDate(order.created_at)}</p>
                  <p><strong>💰</strong> {formatCurrency(order.total)}</p>
                </div>
                <span className={getStatusClass(order.status)}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DETAIL MODAL ─────────────────────────────────── */}
      {selectedOrder && (() => {
        const order = selectedOrder;
        return (
          <div
            className="order-overlay"
            onClick={handleCloseDetail}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="order-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={handleCloseDetail}
                aria-label="Đóng"
              >
                ✕
              </button>

              <div className="modal-head">
                <span className="modal-id">Đơn hàng #{order.order_id}</span>
                <span className={getStatusClass(order.status)}>
                  {order.status}
                </span>
              </div>

              <div className="modal-body">
                <h4>📋 Thông tin vận chuyển</h4>
                <ul>
                  <li><strong>Người nhận:</strong> {order.customer_name}</li>
                  <li><strong>Điện thoại:</strong> {order.phone}</li>
                  <li><strong>Địa chỉ:</strong> {order.address}</li>
                  <li><strong>Ngày đặt:</strong> {formatDate(order.created_at)}</li>
                  <li>
                    <strong>Thanh toán:</strong>{" "}
                    {order.payment_method === "cash"
                      ? "💵 Thanh toán khi nhận hàng"
                      : "🏪 Chuyển khoản"}
                  </li>
                  <li><strong>Tổng tiền:</strong> {formatCurrency(order.total)}</li>
                </ul>

                <h4>🎁 Chi tiết sản phẩm</h4>
                <ul>
                  {order.details && order.details.length > 0 ? (
                    order.details.map((item, i) => (
                      <li key={i}>
                        {item.product_name} — {formatCurrency(item.product_price)} × {item.quantity}
                      </li>
                    ))
                  ) : (() => {
                    const services = parseServicesFromNote(order.note);
                    return services.length > 0 ? (
                      services.map((svc, i) => (
                        <li key={i}>{svc}</li>
                      ))
                    ) : (
                      <li className="empty-note">Không có chi tiết sản phẩm</li>
                    );
                  })()}
                </ul>

                {order.status_history && order.status_history.length > 0 && (
                  <>
                    <h4>📌 Lịch sử trạng thái</h4>
                    <ul>
                      {order.status_history.map((h, i) => (
                        <li key={i}>
                          <strong>{h.status}</strong> — {formatDate(h.timestamp)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {isAdmin && (
                  <div className="status-update">
                    <select
                      value={statusMap[order.order_id] || ""}
                      onChange={(e) =>
                        setStatusMap((prev) => ({
                          ...prev,
                          [order.order_id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">📍 Cập nhật trạng thái</option>
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <button
                      disabled={!statusMap[order.order_id]}
                      onClick={() => updateStatus(order.order_id)}
                    >
                      ✓ Lưu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Receipt;