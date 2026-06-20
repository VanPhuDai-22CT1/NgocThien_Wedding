import React, { useCallback, useEffect, useState, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import { getAuthItem, setAuthItem } from "utils/authStorage";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import { getImageUrl } from "utils/image";
import "./style.scss";

const API_URL = "/api/legacy";
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const normalizeAvatarUrl = (avatarPath = "") => {
  const raw = String(avatarPath || "").trim();
  if (!raw) return "";
  if (raw.startsWith("blob:") || raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return getImageUrl(raw);
};

const buildInitialInfo = (data = {}) => ({
  username: data.username || "",
  full_name: data.full_name || data.username || "",
  email: data.email || "",
  phone: data.phone || "",
  address: data.address || "",
  avatar: data.avatar || "",
});

const UserInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUserId = getAuthItem("user_id");
  const token = getAuthItem("token");

  const [user, setUser] = useState(null);
  const [updatedInfo, setUpdatedInfo] = useState(buildInitialInfo());
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const fileInputRef = useRef();
  const localPreviewUrlRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const todayLabel = new Date().toLocaleDateString("vi-VN");
  const checkoutFromQuery = new URLSearchParams(location.search).get("checkout") === "1";
  const isFromCheckout = Boolean(location.state?.fromCheckout || checkoutFromQuery);

  const syncUserData = useCallback((userData) => {
    setUser(userData);
    setUpdatedInfo(buildInitialInfo(userData));
    setAvatarPreview(normalizeAvatarUrl(userData.avatar));

    if (userData?.id) setAuthItem("user_id", userData.id);
    if (userData?.username) setAuthItem("username", userData.username);
    if (userData?.email) setAuthItem("email", userData.email);
    if (userData?.role) setAuthItem("role", userData.role);
  }, []);

  const fetchUser = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      let res = null;

      if (token) {
        try {
          res = await apiClient.get("/auth/me", { headers: buildAuthHeaders() });
        } catch (authError) {
          if (!storedUserId) throw authError;
        }
      }

      if ((!res?.data?.success || !res?.data?.data) && storedUserId) {
        res = await axios.get(API_URL, {
          params: {
            action: "getUser",
            user_id: storedUserId,
          },
          withCredentials: true,
        });
      }

      if (res?.data?.success && res?.data?.data) {
        syncUserData(res.data.data);
        if (!silent) {
          setFeedback({ type: "", text: "" });
        }
      } else {
        setFeedback({
          type: "error",
          text: res?.data?.message || "Không lấy được thông tin tài khoản. Vui lòng thử lại.",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        text: "Không thể kết nối máy chủ để lấy thông tin tài khoản.",
      });
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [storedUserId, syncUserData, token]);

  useEffect(() => {
    if (!storedUserId && !token) {
      navigate(ROUTERS.USER.LOGIN, { replace: true });
      return;
    }

    fetchUser();
  }, [fetchUser, navigate, storedUserId, token]);

  useEffect(() => {
    return () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
      if (file) {
      if (!file.type.startsWith("image/")) {
        setFeedback({ type: "error", text: "Vui lòng chọn đúng định dạng ảnh." });
        return;
      }

      if (file.size > MAX_AVATAR_SIZE) {
        setFeedback({ type: "error", text: "Ảnh đại diện phải nhỏ hơn 2MB." });
        return;
      }

      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current);
      }

      const localPreviewUrl = URL.createObjectURL(file);
      localPreviewUrlRef.current = localPreviewUrl;
      setAvatarFile(file);
      setAvatarPreview(localPreviewUrl);
      setFeedback({ type: "", text: "" });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setUpdatedInfo(buildInitialInfo(user));
    setAvatarPreview(normalizeAvatarUrl(user?.avatar));
    setFeedback({ type: "", text: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateUserInfo = async () => {
    const { username, full_name, email, phone, address } = updatedInfo;
    if (!full_name.trim() || !email.trim()) {
      setFeedback({ type: "error", text: "Vui lòng nhập họ tên và email để hoàn thiện hồ sơ cưới." });
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      setFeedback({ type: "error", text: "Email không đúng định dạng." });
      return;
    }

    const phoneRegex = /^[0-9+\s().-]{9,15}$/;
    if (phone.trim() && !phoneRegex.test(phone.trim())) {
      setFeedback({ type: "error", text: "Số điện thoại không hợp lệ." });
      return;
    }

    const formData = new FormData();
    formData.append("action", "updateUserInfo");
    formData.append("user_id", user?.id || storedUserId);
    formData.append("username", username.trim() || email.trim());
    formData.append("full_name", full_name.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    formData.append("address", address.trim());
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      setSaving(true);
      const res = await axios.post(API_URL, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data", ...buildAuthHeaders() },
      })

      if (res?.data?.success) {
        if (res?.data?.data) {
          syncUserData(res.data.data);
        } else {
          await fetchUser({ silent: true });
        }
        setIsEditing(false);
        setAvatarFile(null);
        setFeedback({ type: "success", text: "Cập nhật hồ sơ cưới thành công." });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setFeedback({
          type: "error",
          text: res?.data?.message || "Không thể cập nhật thông tin. Vui lòng thử lại.",
        });
      }
    } catch (error) {
      setFeedback({ type: "error", text: "Lỗi hệ thống khi cập nhật thông tin." });
    } finally {
      setSaving(false);
    }
  };

  const formAvatar = avatarPreview || normalizeAvatarUrl(updatedInfo.avatar) || "/default-avatar.png";
  const profileFields = [
    updatedInfo.username,
    updatedInfo.full_name,
    updatedInfo.email,
    updatedInfo.phone,
    updatedInfo.address,
    updatedInfo.avatar,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter((item) => String(item || "").trim() !== "").length / profileFields.length) * 100
  );
  const normalizedRole = String(user?.role || "member").toLowerCase();
  const roleLabel = normalizedRole === "admin" ? "Quản trị viên" : "Thành viên";
  const accountCode = `KH-${String(user?.id || storedUserId || "").padStart(4, "0")}`;

  if (loading) {
    return (
      <div className="customer-info-page">
        <div className="customer-info-skeleton">Đang tải thông tin tài khoản...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="customer-info-page">
        <div className="customer-info-error">
          <p>Không có dữ liệu tài khoản để hiển thị.</p>
          <button className="btn-primary" type="button" onClick={() => fetchUser()}>
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="customer-info-page">
      <div className="customer-info-card">
        <header className="customer-info-header">
          <div>
            <p className="breadcrumb">Trang chủ / Tài khoản / Hồ sơ cưới</p>
            <p className="overline">Không gian cưới của tôi</p>
            <h2>Thông tin cô dâu chú rể</h2>
            <p className="subtitle">Lưu thông tin liên hệ, địa điểm tổ chức và phong cách để Ngọc Thiện Wedding tư vấn trọn vẹn hơn.</p>
          </div>
          <div className="header-meta">
            <span>Ngày cập nhật: {todayLabel}</span>
            {isFromCheckout && <span className="checkout-chip">Đến từ luồng thanh toán</span>}
          </div>
        </header>

        <div className="customer-info-body">
          <aside className="avatar-section">
            <div className="avatar-preview">
              <img src={formAvatar} alt="avatar" className="avatar-img" />
            </div>
            {isEditing ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
                <button
                  className="btn-outline btn-upload"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Chọn ảnh đại diện

                </button>
                <p className="avatar-note">Định dạng JPG/PNG, tối đa 2MB.</p>
              </>
            ) : (
              <p className="avatar-note">Ảnh đại diện giúp đội ngũ tư vấn nhận diện hồ sơ cưới của bạn nhanh hơn.</p>
            )}

            <div className="helper-box">
              <h5>Gợi ý cho ngày cưới</h5>
              <ul>
                <li>Cập nhật đúng số điện thoại để tư vấn viên liên hệ kịp thời.</li>
                <li>Ghi rõ địa điểm tổ chức để đội ngũ chuẩn bị phương án trang trí phù hợp.</li>
                <li>Ảnh đại diện có thể là ảnh cặp đôi hoặc ảnh phong cách cưới bạn yêu thích.</li>
              </ul>
            </div>
          </aside>

          <div className="profile-content">
            <div className="account-highlight-row">
              <article className="highlight-card">
                <p>Mã hồ sơ</p>
                <h4>{accountCode}</h4>
              </article>
              <article className="highlight-card">
                <p>Vai trò</p>
                <h4>{roleLabel}</h4>
              </article>
              <article className="highlight-card highlight-card-progress">
                <div className="progress-header">
                  <p>Hồ sơ cưới hoàn thiện</p>
                  <strong>{profileCompletion}%</strong>
                </div>
                <div className="profile-progress-track">
                  <div className="profile-progress-value" style={{ width: `${profileCompletion}%` }} />
                </div>
              </article>
            </div>

            {feedback.text && (
              <div className={`feedback ${feedback.type === "success" ? "feedback-success" : "feedback-error"}`}>
                {feedback.text}
              </div>
            )}

            <div className="form-wrap">
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  name="full_name"
                  value={updatedInfo.full_name}
                  readOnly={!isEditing}
                  onChange={handleInputChange}
                  placeholder="Nhập họ tên cô dâu/chú rể"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={updatedInfo.email}
                  readOnly={!isEditing}
                  onChange={handleInputChange}
                  placeholder="Nháº­p email"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  name="phone"
                  value={updatedInfo.phone}
                  readOnly={!isEditing}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group full-width">
                <label>Địa điểm tổ chức</label>
                <textarea
                  name="address"
                  value={updatedInfo.address}
                  readOnly={!isEditing}
                  onChange={handleInputChange}
                  placeholder="Nhập địa điểm tổ chức tiệc cưới hoặc lễ gia tiên"
                />
              </div>
            </div>

            <div className="actions">
              {isEditing ? (
                <>
                  <button className="btn-primary" type="button" disabled={saving} onClick={handleUpdateUserInfo}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button className="btn-outline" type="button" disabled={saving} onClick={handleCancelEdit}>
                    Hủy
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-outline" type="button" onClick={() => setIsEditing(true)}>
                    Chỉnh sửa thông tin
                  </button>
                  <button className="btn-outline" type="button" onClick={() => navigate(ROUTERS.USER.OrderDetail)}>
                    Xem lịch sử đặt dịch vụ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserInfo;

