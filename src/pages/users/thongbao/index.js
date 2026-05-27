import React, { useState, useEffect } from "react";
import "./style.scss";
import { getAuthItem } from "utils/authStorage";
import { useLocation, useNavigate } from "react-router-dom";

const Notification = () => {
  const [consultations, setConsultations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    service: "",
    event_date: "",
    note: ""
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConsultations();
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setEditingId(null);
        setSelectedConsultation(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await fetch(
        "http://localhost:4000/api/legacy?action=getConsultations"
      );
      const data = await res.json();

      if (data.success) {
        setConsultations(data.data);
      }
    } catch (error) {
      console.error("Lỗi load dữ liệu:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getServiceList = (serviceValue) => {
    if (!serviceValue) return [];

    return String(serviceValue)
      .split(/,|\||\n|;/)
      .map((service) => service.trim())
      .filter(Boolean);
  };

  const getServicePreview = (serviceValue) => {
    const services = getServiceList(serviceValue);

    if (services.length === 0) {
      return "Chưa có thông tin dịch vụ";
    }

    if (services.length <= 2) {
      return services.join(", ");
    }

    return `${services.slice(0, 2).join(", ")} +${services.length - 2} dịch vụ`;
  };

  const isConfirmedStatus = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    return (
      normalized === "done" ||
      normalized === "confirmed" ||
      normalized === "đã xác nhận" ||
      normalized === "da xac nhan" ||
      normalized === "đang xử lý" ||
      normalized === "dang xu ly" ||
      normalized === "đang giao" ||
      normalized === "dang giao" ||
      normalized === "đã nhận hàng" ||
      normalized === "da nhan hang" ||
      normalized === "đã giao sự kiện" ||
      normalized === "da giao su kien"
    );
  };

  const isProcessingStatus = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    return normalized === "đang xử lý" || normalized === "dang xu ly" || normalized === "dang xu lý";
  };

  const isDeliveringStatus = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    return normalized === "đang giao" || normalized === "dang giao";
  };

  const isCompletedStatus = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    return (
      normalized === "đã nhận hàng" ||
      normalized === "da nhan hang" ||
      normalized === "đã giao sự kiện" ||
      normalized === "da giao su kien"
    );
  };

  const isCancelledStatus = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    return (
      normalized === "cancel" ||
      normalized === "cancelled" ||
      normalized === "đã hủy" ||
      normalized === "da huy"
    );
  };

  const getStatusMeta = (status) => {
    if (isCompletedStatus(status)) {
      return {
        label: "Đã giao sự kiện",
        className: "status-badge confirmed",
        desc: "Tiệc cưới đã hoàn tất và hệ thống đã chốt trạng thái thành công."
      };
    }

    if (isDeliveringStatus(status)) {
      return {
          label: "Đang giao",
          className: "status-badge pending",
          desc: "Đơn vị đang chuẩn bị và triển khai dịch vụ sát ngày cưới."
      };
    }

    if (isProcessingStatus(status)) {
      return {
          label: "Đang xử lý",
          className: "status-badge pending",
          desc: "Admin đã tiếp nhận lịch tư vấn và đang xử lý yêu cầu của bạn."
      };
    }

    if (isConfirmedStatus(status)) {
      return {
          label: "Đã xác nhận",
          className: "status-badge confirmed",
          desc: "Yêu cầu đã được AI xác nhận tự động và đang chờ admin tiếp nhận."
      };
    }

    if (isCancelledStatus(status)) {
      return {
          label: "Đã hủy",
          className: "status-badge cancelled",
          desc: "Lịch tư vấn đã hủy và không còn hiệu lực."
      };
    }

      return {
      label: "Chờ xử lý",
      className: "status-badge pending",
      desc: "Yêu cầu đang chờ admin xác nhận."
    };
  };

  const callApi = async (action, bodyData) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/legacy?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData)
        }
      );

      const data = await res.json();

      if (data.success) {
        await fetchConsultations();
        return true;
      }

      alert(data.message || "Thao tác thất bại!");
      return false;
    } catch (error) {
      console.error("Lỗi:", error);
      return false;
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedConsultation(item);

    setFormData({
      id: item.id,
      name: item.name,
      service: item.service,
      event_date: item.event_date,
      note: item.note || ""
    });
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.service || !formData.event_date) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const success = await callApi("updateConsultation", formData);

    if (success) {
      setEditingId(null);
      setSelectedConsultation(null);
      alert("Cập nhật thành công!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy lịch này?")) return;

    const success = await callApi("deleteConsultation", { id });

    if (success) {
      setEditingId(null);
      setSelectedConsultation(null);
      alert("Hủy lịch thành công!");
    }
  };

  const handleOpenDetail = (item) => {
    setEditingId(null);
    setSelectedConsultation(item);
  };

  const handleCardKeyDown = (event, item) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenDetail(item);
    }
  };

  const handleCloseDetail = () => {
    setEditingId(null);
    setSelectedConsultation(null);
  };

  const currentUserId = Number(getAuthItem("user_id") || 0);
  const currentEmail = String(getAuthItem("email") || "").toLowerCase().trim();

  const visibleConsultations = consultations.filter((item) => {
    if (!currentUserId && !currentEmail) return true;

    const itemUserId = Number(item.user_id || 0);
    const itemEmail = String(item.email || "").toLowerCase().trim();

    if (currentUserId && itemUserId === currentUserId) return true;
    if (currentEmail && itemEmail === currentEmail) return true;

    return false;
  });

  return (
    <div className="notification-page">
      <div className="notification-container">
        <div className="header-block">
          <h2>Thông báo đặt tiệc</h2>
          <p>Theo dõi yêu cầu đặt dịch vụ và các lịch tư vấn đã gửi cho Ngọc Thiện Wedding.</p>
        </div>

        {location.state?.orderNotice && (
          <div className="order-notice-box">
            <h3>🎉 Đặt dịch vụ thành công</h3>
            <p><strong>Mã đơn:</strong> #{location.state.orderNotice.orderId}</p>
            <p><strong>Thời gian:</strong> {location.state.orderNotice.orderTime}</p>
            <p><strong>Trạng thái:</strong> {location.state.orderNotice.status}</p>
            <p>{location.state.orderNotice.message}</p>
            <button className="btn-back-home" onClick={() => navigate("/")}>Về trang chủ</button>
          </div>
        )}

        {visibleConsultations.length === 0 ? (
          <p className="empty">Chưa có yêu cầu nào</p>
        ) : (
          <div className="notification-list">
            {visibleConsultations.map((item) => {
              const statusMeta = getStatusMeta(item.status);
              const servicePreview = getServicePreview(item.service);

              return (
                <div
                  key={item.id}
                  className="notification-card"
                  onClick={() => handleOpenDetail(item)}
                  onKeyDown={(event) => handleCardKeyDown(event, item)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="card-head compact">
                    <div>
                      <h3>Yêu cầu #{item.id}</h3>
                      <small>Gửi lúc: {formatDateTime(item.created_at)}</small>
                    </div>
                    <span className={statusMeta.className}>{statusMeta.label}</span>
                  </div>

                  <div className="card-summary">
                    <div className="summary-line">
                      <span>Khách hàng</span>
                      <b>{item.name || "-"}</b>
                    </div>
                    <div className="summary-line">
                      <span>Ngày tổ chức</span>
                      <b>{formatDate(item.event_date) || "-"}</b>
                    </div>
                    <div className="summary-line summary-service">
                      <span>Dịch vụ</span>
                        <b>{servicePreview}</b>
                    </div>
                  </div>

                  <button
                    className="btn-view-detail"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenDetail(item);
                    }}
                  >
                    Xem chi tiết
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {selectedConsultation && (() => {
          const statusMeta = getStatusMeta(selectedConsultation.status);
          const canEdit =
            !isConfirmedStatus(selectedConsultation.status) &&
            !isCancelledStatus(selectedConsultation.status);
          const serviceList = getServiceList(selectedConsultation.service);

          return (
            <div className="detail-overlay" onClick={handleCloseDetail}>
              <div
                className="detail-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <button className="modal-close" onClick={handleCloseDetail}>
                  ×
                </button>

                {editingId === selectedConsultation.id ? (
                  <div className="edit-form modal-edit-form">
                    <div className="modal-head">
                      <div>
                        <h3>Chỉnh sửa yêu cầu #{selectedConsultation.id}</h3>
                        <small>Điều chỉnh thông tin trước khi admin xác nhận</small>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />

                    <select
                      value={formData.service}
                      onChange={(e) =>
                        setFormData({ ...formData, service: e.target.value })
                      }
                    >
                      <option value="">Chọn dịch vụ</option>
                      <option value="Chụp ảnh cưới">Chụp ảnh cưới</option>
                      <option value="Trang trí tiệc cưới">Trang trí tiệc cưới</option>
                      <option value="Tổ chức trọn gói">Tổ chức trọn gói</option>
                    </select>

                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          event_date: e.target.value
                        })
                      }
                    />

                    <textarea
                      value={formData.note}
                      onChange={(e) =>
                        setFormData({ ...formData, note: e.target.value })
                      }
                      placeholder="Ghi chú thêm"
                    />

                    <div className="actions">
                      <button className="btn-save" onClick={handleUpdate}>
                        Lưu thay đổi
                      </button>

                      <button className="btn-cancel" onClick={handleCloseDetail}>
                        Đóng
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="modal-head">
                      <div>
                        <h3>Chi tiết yêu cầu #{selectedConsultation.id}</h3>
                        <small>Gửi lúc: {formatDateTime(selectedConsultation.created_at)}</small>
                      </div>
                      <span className={statusMeta.className}>{statusMeta.label}</span>
                    </div>

                    <p className="status-desc modal-status-desc">{statusMeta.desc}</p>

                    <div className="card-info-grid modal-info-grid">
                      <div className="info-item">
                        <span>Khách hàng</span>
                        <b>{selectedConsultation.name || "-"}</b>
                      </div>
                      <div className="info-item">
                        <span>Email</span>
                        <b>{selectedConsultation.email || "-"}</b>
                      </div>
                      <div className="info-item">
                        <span>Số điện thoại</span>
                        <b>{selectedConsultation.phone || "-"}</b>
                      </div>
                      <div className="info-item">
                        <span>Ngày tổ chức</span>
                        <b>{formatDate(selectedConsultation.event_date) || "-"}</b>
                      </div>
                      <div className="info-item">
                        <span>Mã lịch</span>
                        <b>#{selectedConsultation.id}</b>
                      </div>
                    </div>

                    <div className="service-box modal-service-box">
                      <span>Dịch vụ đã chọn</span>
                      {serviceList.length > 0 ? (
                        <ul className="service-list">
                          {serviceList.map((serviceName, index) => (
                            <li
                              key={`${selectedConsultation.id}-${serviceName}-${index}`}
                            >
                              {serviceName}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Chưa có thông tin dịch vụ</p>
                      )}
                    </div>

                    <div className="note-box modal-note-box">
                      <span>Ghi chú</span>
                      <p>{selectedConsultation.note || "Không có ghi chú"}</p>
                    </div>

                    <div className="actions modal-actions">
                      {isCompletedStatus(selectedConsultation.status) ? (
                        <button className="btn-contacting">Đã giao sự kiện</button>
                      ) : isDeliveringStatus(selectedConsultation.status) ? (
                        <button className="btn-contacting">Đang giao</button>
                      ) : isProcessingStatus(selectedConsultation.status) ? (
                        <button className="btn-contacting">Đang xử lý</button>
                      ) : isConfirmedStatus(selectedConsultation.status) ? (
                        <button className="btn-contacting">Đã xác nhận</button>
                      ) : isCancelledStatus(selectedConsultation.status) ? (
                        <button className="btn-cancelled-view">Đã hủy lịch</button>
                      ) : (
                        <>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(selectedConsultation)}
                            disabled={!canEdit}
                            >
                            Thay đổi
                          </button>

                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(selectedConsultation.id)}
                            disabled={!canEdit}
                          >
                            Hủy lịch
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Notification;
