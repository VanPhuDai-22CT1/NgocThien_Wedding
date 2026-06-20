import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaCalendarAlt, FaClipboardList, FaMapMarkerAlt, FaPhoneAlt, FaRegHeart, FaTimes } from "react-icons/fa";
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
  date ? new Date(date).toLocaleString("vi-VN") : "Chưa cập nhật";

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

const parseServicesFromNote = (note) => {
  if (!note) return [];

  const selectedMatch = note.match(/Danh sách gói đã chọn:\s*([^\n]+)/);
  if (selectedMatch) {
    return selectedMatch[1].split(",").map((service) => service.trim()).filter(Boolean);
  }

  const serviceMatch = note.match(/Dịch vụ:\s*([^|]+)/);
  if (serviceMatch) {
    return serviceMatch[1].split(",").map((service) => service.trim()).filter(Boolean);
  }

  return [];
};

const getStatusClass = (status) => {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized.includes("bàn giao") || normalized.includes("đã giao") || normalized === "delivered") {
    return "status success";
  }

  if (normalized.includes("đang giao") || normalized === "shipping") {
    return "status delivering";
  }

  if (normalized.includes("xác nhận")) {
    return "status confirmed";
  }

  if (normalized.includes("hủy") || normalized === "cancelled") {
    return "status cancel";
  }

  return "status processing";
};

const getPrimaryServices = (order) => {
  if (order.details && order.details.length > 0) {
    return order.details.map((item) => item.product_name);
  }

  return parseServicesFromNote(order.note);
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
      setMessage("Vui lòng đăng nhập để xem lịch sử đặt dịch vụ.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get(`/orders/user/${userId}`, {
        headers: buildAuthHeaders(),
      });

      if (res.data.success) {
        const normalizedOrders = (res.data.orders || []).map((order) => {
          const details = Array.isArray(order.OrderItems)
            ? order.OrderItems.map((item) => ({
                product_name: item.Product?.name || "Dịch vụ cưới",
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
            ? "Bạn chưa có lịch đặt dịch vụ nào."
            : ""
        );
      } else {
        setOrders([]);
        setMessage(res.data.message || "Bạn chưa có lịch đặt dịch vụ nào.");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setMessage("Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!selectedOrder) return;

    const onKey = (e) => {
      if (e.key === "Escape") setSelectedOrder(null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedOrder]);

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
        `${process.env.REACT_APP_API_URL || "/api"}/orders/${orderId}/status`,
        { status: statusMapping[newStatus] || "processing" },
        { headers: buildAuthHeaders() }
      );

      if (res.data.success) {
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

  const orderList = Array.isArray(orders) ? orders : [];
  const completedCount = orderList.filter((order) =>
    getStatusClass(order.status).includes("success")
  ).length;
  const activeCount = orderList.filter((order) =>
    !getStatusClass(order.status).includes("success") &&
    !getStatusClass(order.status).includes("cancel")
  ).length;

  return (
    <div className="receipt-page">
      <section className="orders-hero">
        <div>
          <span className="orders-eyebrow">Ngọc Thiện Wedding</span>
          <h1>Lịch sử đặt dịch vụ</h1>
          <p>
            Theo dõi các gói cưới đã đặt, lịch tư vấn và trạng thái bàn giao cho ngày trọng đại.
          </p>
        </div>

        <div className="orders-stats" aria-label="Tổng quan đơn hàng">
          <div>
            <strong>{orderList.length}</strong>
            <span>Tổng lịch đặt</span>
          </div>
          <div>
            <strong>{activeCount}</strong>
            <span>Đang chuẩn bị</span>
          </div>
          <div>
            <strong>{completedCount}</strong>
            <span>Đã bàn giao</span>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="orders-state">
          <span className="state-icon"><FaRegHeart /></span>
          <h2>Đang tải lịch đặt</h2>
          <p>Chúng tôi đang kiểm tra thông tin dịch vụ của bạn.</p>
        </div>
      ) : orderList.length === 0 ? (
        <div className="orders-state">
          <span className="state-icon"><FaClipboardList /></span>
          <h2>Chưa có lịch đặt</h2>
          <p>{message || "Khi bạn đặt dịch vụ cưới, thông tin sẽ được lưu tại đây."}</p>
        </div>
      ) : (
        <section
          className={`receipt-list ${orderList.length === 1 ? "single" : ""}`}
          aria-label="Danh sách lịch đặt dịch vụ"
        >
          {orderList.map((order) => {
            const services = getPrimaryServices(order);
            const leadService = services[0] || "Gói dịch vụ cưới";

            return (
              <article
                key={order.order_id}
                className="receipt-card"
                onClick={() => setSelectedOrder(order)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedOrder(order)}
              >
                <div className="card-topline">
                  <span>Mã lịch #{order.order_id}</span>
                  <span className={getStatusClass(order.status)}>{order.status}</span>
                </div>

                <h2>{leadService}</h2>

                <div className="card-info">
                  <span><FaCalendarAlt /> {formatDate(order.created_at)}</span>
                  <span><FaMapMarkerAlt /> {order.address || "Chưa cập nhật địa điểm"}</span>
                </div>

                <div className="card-footer">
                  <div>
                    <span>Tạm tính</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>
                  <button type="button">Xem chi tiết</button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedOrder && (() => {
        const order = selectedOrder;
        const services = getPrimaryServices(order);

        return (
          <div
            className="order-overlay"
            onClick={() => setSelectedOrder(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className="order-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng"
              >
                <FaTimes />
              </button>

              <div className="modal-head">
                <span className="orders-eyebrow">Chi tiết lịch đặt</span>
                <h2>Mã lịch #{order.order_id}</h2>
                <span className={getStatusClass(order.status)}>{order.status}</span>
              </div>

              <div className="modal-grid">
                <section>
                  <h3>Thông tin liên hệ</h3>
                  <dl className="detail-list">
                    <div>
                      <dt>Người đặt</dt>
                      <dd>{order.customer_name || "Chưa cập nhật"}</dd>
                    </div>
                    <div>
                      <dt>Số điện thoại</dt>
                      <dd><FaPhoneAlt /> {order.phone || "Chưa cập nhật"}</dd>
                    </div>
                    <div>
                      <dt>Địa điểm</dt>
                      <dd>{order.address || "Chưa cập nhật"}</dd>
                    </div>
                    <div>
                      <dt>Ngày tạo lịch</dt>
                      <dd>{formatDate(order.created_at)}</dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <h3>Thanh toán</h3>
                  <dl className="detail-list">
                    <div>
                      <dt>Phương thức</dt>
                      <dd>
                        {order.payment_method === "cash"
                          ? "Thanh toán khi bàn giao"
                          : "Chuyển khoản"}
                      </dd>
                    </div>
                    <div>
                      <dt>Tổng chi phí</dt>
                      <dd className="total-price">{formatCurrency(order.total)}</dd>
                    </div>
                  </dl>
                </section>
              </div>

              <section className="service-section">
                <h3>Dịch vụ đã đặt</h3>
                {services.length > 0 ? (
                  <ul className="service-list">
                    {order.details && order.details.length > 0
                      ? order.details.map((item, i) => (
                          <li key={i}>
                            <span>{item.product_name}</span>
                            <strong>{formatCurrency(item.product_price)} x {item.quantity}</strong>
                          </li>
                        ))
                      : services.map((service, i) => (
                          <li key={i}>
                            <span>{service}</span>
                            <strong>Đã ghi nhận</strong>
                          </li>
                        ))}
                  </ul>
                ) : (
                  <p className="empty-note">Chưa có chi tiết dịch vụ trong lịch đặt này.</p>
                )}
              </section>

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
                    <option value="">Cập nhật trạng thái</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    disabled={!statusMap[order.order_id]}
                    onClick={() => updateStatus(order.order_id)}
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Receipt;
