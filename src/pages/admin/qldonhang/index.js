import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuthItem, logoutAuthSession } from "utils/authStorage";
import { getDarkMode, setDarkModeStorage } from "utils/darkMode";
import {
  FaArrowLeft,
  FaBell,
  FaBox,
  FaChartPie,
  FaComments,
  FaHistory,
  FaRegCalendarAlt,
  FaShoppingCart,
  FaSignOutAlt,
  FaUsers,
  FaMoon,
  FaSun
} from "react-icons/fa";
import "./style.scss";

const API = `${process.env.REACT_APP_API_URL || "/api"}/legacy`;

export default function OrderManagement() {
  const navigate = useNavigate();
  const role = getAuthItem("role");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingStatusOrderId, setEditingStatusOrderId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => getDarkMode());

  useEffect(() => {
    setDarkModeStorage(darkMode);
  }, [darkMode]);

  /* ================= FETCH ================= */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/legacy`, { params: { action: "getOrders" }, headers: buildAuthHeaders() });

      if (res.data?.success) {
        setOrders(res.data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      alert("Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= UPDATE ================= */
  const updateStatus = async (orderId, status) => {
    try {
      setLoading(true);
      await apiClient.post("/legacy", { action: "updateStatus", order_id: orderId, status }, { headers: buildAuthHeaders() });
      fetchOrders();
    } catch (err) {
      alert("Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
const deleteOrder = async (orderId) => {
  if (!window.confirm("Bạn có chắc muốn xóa?")) return;

  try {
    setLoading(true);

    const res = await apiClient.post("/legacy", { action: "deleteOrder", order_id: orderId }, { headers: buildAuthHeaders() });

    if (res.data?.success) {
      alert("Đã xóa thành công");
      fetchOrders();
    } else {
      alert(res.data?.message || "Xóa thất bại");
    }

  } catch (err) {
    console.error(err);
    alert("Lỗi khi xóa");
  } finally {
    setLoading(false);
  }
};

  const logout = () => {
    logoutAuthSession("/");
  };

  const formatMoney = (value) =>
    Number(value).toLocaleString("vi-VN") + " VNĐ";

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })
      : "-";

  const formatPayment = (payment) => {
    const normalized = String(payment || "").trim().toLowerCase();
    if (normalized === "cash") return "Tiền mặt";
    if (normalized === "bank") return "Chuyển khoản";
    if (!normalized) return "Chưa chọn";
    return payment;
  };

  const getStatusMeta = (status = "") => {
    const normalized = String(status).trim().toLowerCase();

    if (normalized === "đang xử lý") {
      return { label: "Đang xử lý", className: "processing" };
    }

    if (normalized === "đang giao") {
      return { label: "Đang giao", className: "shipping" };
    }

    if (
      normalized === "đã nhận hàng" ||
      normalized === "đã giao sự kiện" ||
      normalized === "đã bàn giao sự kiện"
    ) {
      return { label: "Đã bàn giao sự kiện", className: "received" };
    }

    if (normalized === "cancelled" || normalized === "hủy đơn" || normalized === "huy don" || normalized === "đã hủy") {
      return { label: "Đã hủy", className: "cancelled" };
    }

    if (normalized === "đã xác nhận") {
      return { label: "Đang xử lý", className: "processing" };
    }

    return { label: status || "Không xác định", className: "unknown" };
  };

  const getSelectStatusValue = (status = "") => {
    const normalized = String(status).trim().toLowerCase();

    if (normalized === "đã nhận hàng" || normalized === "da nhan hang") {
      return "Đã bàn giao sự kiện";
    }

    if (normalized === "đã giao sự kiện" || normalized === "da giao su kien") {
      return "Đã bàn giao sự kiện";
    }

    return status;
  };

  const isCompletedStatus = (status = "") => {
    const normalized = String(status).trim().toLowerCase();
    return (
      normalized === "đã giao sự kiện" ||
      normalized === "da giao su kien" ||
      normalized === "đã bàn giao sự kiện" ||
      normalized === "da ban giao su kien" ||
      normalized === "đã nhận hàng" ||
      normalized === "da nhan hang"
    );
  };

  /* ================= RENDER ================= */
  return (
    <div className={`admin-layout ${darkMode ? "dark" : ""}`}>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <h1>NGỌC THIỆN ADMIN</h1>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">
            <FaChartPie /> Tổng quan
          </NavLink>

          {role === "admin" && (
            <NavLink to="/qlnguoidung">
              <FaUsers /> Người dùng
            </NavLink>
          )}

          <NavLink to="/qlsanpham">
            <FaBox /> Dịch vụ
          </NavLink>

          <NavLink to="/qldonhang" className="active">
            <FaShoppingCart /> Đơn hàng
          </NavLink>

          <NavLink to="/qltinnhan">
            <FaComments /> Tin nhắn
          </NavLink>

          <NavLink to="/notification">
            <FaBell /> Lịch tư vấn
          </NavLink>

          <NavLink to="/lichlamviec">
            <FaRegCalendarAlt /> Lịch làm việc
          </NavLink>

          <NavLink to="/qlhoatdong">
            <FaHistory /> Lịch sử
          </NavLink>

        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="admin-content">

        <div className="admin-header">
          <div>
            <h2>
              <FaShoppingCart /> Quản lý đơn hàng
            </h2>
            <p className="subtitle">Theo dõi và cập nhật trạng thái đơn hàng của khách</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="dark-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title="Chế độ tối"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button
              className="btn-back"
              onClick={() => navigate("/dashboard")}
            >
              <FaArrowLeft /> Quay lại
            </button>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <div className="orders-scroll">
              {orders.length === 0 ? (
                <div className="empty">Không có đơn hàng</div>
              ) : (
                orders.map((order) => {
                  const statusMeta = getStatusMeta(order.status);
                  const completedStatus = isCompletedStatus(order.status);
                  const canEditStatus = !completedStatus || editingStatusOrderId === order.order_id;

                  return (
                    <div className="order-card" key={order.order_id}>
                      <div className="order-card__top">
                        <div className="order-card__title">
                          <span className="id-badge">#{order.order_id}</span>
                          <span className={`status-badge ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <span className="money">{formatMoney(order.total)}</span>
                      </div>

                      <div className="order-card__meta">
                        <div>
                          <span>Ngày đặt</span>
                          <b>{formatDate(order.created_at)}</b>
                        </div>
                        <div>
                          <span>Cập nhật</span>
                          <b>{formatDate(order.updated_at)}</b>
                        </div>
                      </div>

                      <div className="order-card__customer">
                        <p><span>Khách hàng:</span> <b>{order.customer_name || "Khách lẻ"}</b></p>
                        <p><span>Số điện thoại:</span> <b>{order.phone || "-"}</b></p>
                        <p><span>Thanh toán:</span> <b>{formatPayment(order.payment_method)}</b></p>
                        {order.note ? (
                          <p className="note-line" title={order.note}>
                            <span>Ghi chú:</span> <b>{order.note}</b>
                          </p>
                        ) : null}
                      </div>

                      <div className="order-card__actions">
                        {canEditStatus ? (
                          <div className="order-status">
                            <span>Đổi trạng thái</span>
                            <select
                              value={getSelectStatusValue(order.status)}
                              onChange={(e) => {
                                updateStatus(order.order_id, e.target.value);
                                setEditingStatusOrderId(null);
                              }}
                            >
                              <option value="Đang xử lý">Đang xử lý</option>
                              <option value="Đang giao">Đang giao</option>
                              <option value="Đã bàn giao sự kiện">Đã bàn giao sự kiện</option>
                              <option value="Hủy đơn">Hủy đơn</option>
                            </select>
                          </div>
                        ) : (
                          <button
                            className="btn-edit-status"
                            onClick={() => setEditingStatusOrderId(order.order_id)}
                          >
                            Chỉnh sửa
                          </button>
                        )}

                        <button
                          className="btn-delete"
                          onClick={() => deleteOrder(order.order_id)}
                          disabled={[
                            "cancelled",
                            "hủy đơn",
                            "huy don",
                            "đã hủy"
                          ].includes(String(order.status).toLowerCase())}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
