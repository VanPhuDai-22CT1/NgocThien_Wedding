import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUsers,
  FaTrash,
  FaEdit,
  FaArrowLeft,
  FaChartPie,
  FaBox,
  FaImage,
  FaShoppingCart,
  FaComments,
  FaBell,
  FaHistory,
  FaRegCalendarAlt,
} from "react-icons/fa";
import { getAuthItem } from "utils/authStorage";
import "./style.scss";

const API_URL = `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/legacy`;

const UserManagement = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatedInfo, setUpdatedInfo] = useState({
    username: "",
    email: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // ================= LOAD USERS =================
  useEffect(() => {
    const storedRole = getAuthItem("role");

    if (!storedRole || storedRole !== "admin") {
      navigate("/");
      return;
    }

    (async () => {
      try {
        const res = await apiClient.post(
          "/legacy",
          { action: "getUsers" },
          { headers: buildAuthHeaders() }
        );

        const data = res?.data;
        if (!data) {
          throw new Error('Empty response');
        }

        // Legacy endpoint may return an array or an object
        const usersPayload = Array.isArray(data) ? data : data.data || data.rows || [];
        setUsers(usersPayload);
      } catch (err) {
        console.error('Load users error:', err);
        setErrorMessage("Lỗi tải dữ liệu người dùng");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // ================= DELETE =================
  const handleDeleteUser = async (user_id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      const res = await apiClient.post(
        "/legacy",
        { action: "deleteUser", user_id: user_id },
        { headers: buildAuthHeaders() }
      );

      if (res.data && res.data.success) {
        setUsers((prev) => prev.filter((user) => user.id !== user_id));
      } else {
        alert(res.data?.message || "Lỗi khi xóa người dùng");
      }
    } catch (err) {
      console.error('Delete user error:', err);
      alert("Lỗi khi xóa người dùng");
    }
  };
// ================= CHANGE ROLE =================
const handleChangeRole = async (user_id, newRole) => {
  try {
    const res = await apiClient.post(
      "/legacy",
      { action: "updateUserRole", user_id: user_id, role: newRole },
      { headers: buildAuthHeaders() }
    );

    if (res.data && res.data.success) {
      setUsers((prev) => prev.map((user) => (user.id === user_id ? { ...user, role: newRole } : user)));
    } else {
      alert(res.data?.message || "Lỗi khi cập nhật vai trò");
    }
  } catch (err) {
    console.error('Update role error:', err);
    alert("Lỗi khi cập nhật vai trò");
  }
};
  // ================= UPDATE =================
  const handleUpdateUserInfo = async () => {
    if (!selectedUser) return;

    try {
      const res = await apiClient.post(
        "/legacy",
        {
          action: "updateUserInfo",
          user_id: selectedUser.id,
          username: updatedInfo.username,
          email: updatedInfo.email,
        },
        { headers: buildAuthHeaders() }
      );

      if (res.data && res.data.success) {
        setUsers((prev) => prev.map((user) => (user.id === selectedUser.id ? { ...user, ...updatedInfo } : user)));
        setSelectedUser(null);
        setUpdatedInfo({ username: "", email: "" });
      } else {
        alert(res.data?.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      console.error('Update user info error:', err);
      alert("Lỗi khi cập nhật");
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setUpdatedInfo({
      username: user.username,
      email: user.email,
    });
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="logo">NGỌC THIỆN ADMIN</div>
        <ul>
          <li>
            <Link to="/dashboard">
              <FaChartPie /> Tổng quan
            </Link>
          </li>

          <li className="active">
            <Link to="/qlnguoidung">
              <FaUsers /> Người dùng
            </Link>
          </li>

          <li>
            <Link to="/qlsanpham">
              <FaBox /> Dịch vụ
            </Link>
          </li>

          <li>
            <Link to="/qlhinhanh">
              <FaImage /> Ảnh trang chủ
            </Link>
          </li>

          <li>
            <Link to="/qldonhang">
              <FaShoppingCart /> Đơn hàng
            </Link>
          </li>

          <li>
            <Link to="/qltinnhan">
              <FaComments /> Tin nhắn
            </Link>
          </li>

          <li>
            <Link to="/notification">
              <FaBell /> Lịch tư vấn
            </Link>
          </li>

          <li>
            <Link to="/lichlamviec">
              <FaRegCalendarAlt /> Lịch làm việc
            </Link>
          </li>

          <li>
            <Link to="/qlhoatdong">
              <FaHistory /> Lịch sử hoạt động
            </Link>
          </li>

          <li>
            <Link to="/thong-ke">
              <FaChartPie /> Thống kê
            </Link>
          </li>

          <li>
            <Link to="/admin/ho-so-nguoi-code">
              <FaUsers /> Hồ sơ người code
            </Link>
          </li>
        </ul>
      </aside>

      {/* MAIN CONTENT */}
      <div className="admin-content">
        <div className="page-header">
          <h2>
            <FaUsers /> Quản lý người dùng
          </h2>
          <button
            className="back-btn"
            onClick={() => navigate("/dashboard")}
          >
            <FaArrowLeft /> Quay lại
          </button>
        </div>

        {errorMessage && (
          <div className="error-box">{errorMessage}</div>
        )}

        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : (
          <div className="table-wrapper">
            {users.length === 0 ? (
              <div className="empty">Không có người dùng</div>
            ) : (
              <div className="user-grid">
                {users.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-card-head">
                      <span className="user-id">#{user.id}</span>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => openEditModal(user)}
                          title="Chỉnh sửa"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="user-name">{user.username}</div>
                    <div className="user-email">{user.email}</div>

                    <div className="user-role-row">
                      <span>Vai trò</span>
                      <select
                        className="role-select"
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EDIT MODAL */}
        {selectedUser && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Chỉnh sửa người dùng</h3>

              <input
                type="text"
                placeholder="Tên người dùng"
                value={updatedInfo.username}
                onChange={(e) =>
                  setUpdatedInfo({
                    ...updatedInfo,
                    username: e.target.value,
                  })
                }
              />

              <input
                type="email"
                placeholder="Email"
                value={updatedInfo.email}
                onChange={(e) =>
                  setUpdatedInfo({
                    ...updatedInfo,
                    email: e.target.value,
                  })
                }
              />

              <div className="modal-actions">
                <button
                  className="save-btn"
                  onClick={handleUpdateUserInfo}
                >
                  Lưu
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;