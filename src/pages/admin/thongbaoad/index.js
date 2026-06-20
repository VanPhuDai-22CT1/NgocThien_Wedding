import React, { useEffect, useMemo, useRef, useState } from "react";
  import "./style.scss";
  import { NavLink, useLocation, useNavigate } from "react-router-dom";
  import { createPortal } from "react-dom";
  import { apiClient, buildAuthHeaders } from "utils/apiClient";
  import {
    FaBell,
    FaShoppingCart,
    FaTimes,
    FaArrowLeft,
    FaChartPie,
    FaUsers,
    FaBox,
    FaImage,
    FaComments,
    FaHistory,
    FaRegCalendarAlt,
  } from "react-icons/fa";

  const API = "/api/legacy";

  const Notification = () => {
    const [consultations, setConsultations] = useState([]);
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [highlightedConsultationId, setHighlightedConsultationId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const cardRefs = useRef({});

    const normalizeStatus = (status) => String(status || "").trim().toLowerCase();

    const isAutoConfirmedStatus = (status) => {
      const normalized = normalizeStatus(status);
      return normalized === "đã xác nhận" || normalized === "da xac nhan" || normalized === "done" || normalized === "confirmed";
    };

    const isProcessingStatus = (status) => {
      const normalized = normalizeStatus(status);
      return normalized === "đang xử lý" || normalized === "dang xu ly";
    };

    const isDeliveringStatus = (status) => {
      const normalized = normalizeStatus(status);
      return normalized === "đang giao" || normalized === "dang giao";
    };

    const isCompletedStatus = (status) => {
      const normalized = normalizeStatus(status);
      return normalized === "đã nhận hàng" || normalized === "da nhan hang" || normalized === "đã giao sự kiện" || normalized === "da giao su kien";
    };

    const isCancelledStatus = (status) => {
      const normalized = normalizeStatus(status);
      return normalized === "cancel" || normalized === "đã hủy" || normalized === "da huy";
    };

    const isConfirmedStatus = (status) =>
      isAutoConfirmedStatus(status) || isProcessingStatus(status) || isDeliveringStatus(status) || isCompletedStatus(status);

    const isPendingStatus = (status) => !isConfirmedStatus(status) && !isCancelledStatus(status);

    const renderStatus = (status) => {
      if (isAutoConfirmedStatus(status)) return <span className="status done">Đã xác nhận</span>;
      if (isProcessingStatus(status)) return <span className="status processing">Đang xử lý</span>;
      if (isDeliveringStatus(status)) return <span className="status delivering">Đang giao</span>;
      if (isCompletedStatus(status)) return <span className="status completed">Đã giao sự kiện</span>;
      if (isCancelledStatus(status)) return <span className="status cancel">Đã hủy</span>;
      return <span className="status pending">Đã tạo lịch</span>;
    };

    const fetchConsultations = async () => {
      try {
        const res = await apiClient.get(`/legacy`, { params: { action: "getConsultations" }, headers: buildAuthHeaders() });
          const data = res.data || {};
        if (!data.success) return;

        const newData = (data.data || [])
          .map((item) => ({ ...item, status: item.status || "pending" }))
          .sort((a, b) => {
            const getPriority = (status) => {
              const normalized = normalizeStatus(status);
              if (normalized === "đã xác nhận" || normalized === "da xac nhan") return 0;
              if (normalized === "đang xử lý" || normalized === "dang xu ly") return 1;
              if (normalized === "đang giao" || normalized === "dang giao") return 2;
              if (normalized === "đã nhận hàng" || normalized === "da nhan hang" || normalized === "đã giao sự kiện" || normalized === "da giao su kien") return 3;
              if (normalized === "cancel" || normalized === "đã hủy" || normalized === "da huy") return 4;
              return 3;
            };
            const diff = getPriority(a.status) - getPriority(b.status);
            return diff !== 0 ? diff : Number(b.id) - Number(a.id);
          });

        setConsultations(newData);
        setSelectedConsultation((prev) => {
          if (!prev) return prev;
          const fresh = newData.find((item) => item.id === prev.id);
          return fresh || prev;
        });
      } catch (error) {
        console.log("Lỗi load dữ liệu:", error);
      }
    };

    const updateStatus = async (id, status) => {
      try {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("status", status);

        const res = await apiClient.post(`/legacy`, { action: "updateConsultationStatus", id, status }, { headers: buildAuthHeaders() });
        const data = res.data || {};
        if (!data.success) {
          alert(data.message || "Cập nhật thất bại");
          return;
        }

        setConsultations((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
        setSelectedConsultation((prev) => (prev && prev.id === id ? { ...prev, status } : prev));

        if (data.warning) {
          alert(`Đã xác nhận lịch tư vấn.\nLưu ý: ${data.warning}`);
        }
      } catch (error) {
        console.log("Lỗi cập nhật:", error);
        alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
      }
    };

    const markConsultationAsRead = async (id) => {
      try {
        const formData = new FormData();
        formData.append("id", id);

        const res = await apiClient.post(`/legacy`, { action: "markConsultationAsRead", id }, { headers: buildAuthHeaders() });
        const data = res.data || {};
        if (data.success && data.consultation) {
          setConsultations((prev) => prev.map((item) => (item.id === id ? data.consultation : item)));
          setSelectedConsultation((prev) => (prev && prev.id === id ? data.consultation : prev));
        }
      } catch (error) {
        console.log("Lỗi đánh dấu đã đọc:", error);
      }
    };

    const getServicePreview = (service) => {
      const list = String(service || "")
        .split(/,|;|\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (list.length === 0) return "-";
      if (list.length <= 2) return list.join(", ");
      return `${list.slice(0, 2).join(", ")} +${list.length - 2}`;
    };

    const handleOpenDetail = (item) => {
      setSelectedConsultation(item);
      markConsultationAsRead(item.id);
      navigate(`/notification?consultationId=${item.id}`, { replace: true });
    };

    const handleCloseDetail = () => {
      setSelectedConsultation(null);
      navigate("/notification", { replace: true });
    };

    useEffect(() => {
      fetchConsultations();
    }, []);

    useEffect(() => {
      const intervalId = setInterval(fetchConsultations, 30000);
      return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
      const query = new URLSearchParams(location.search);
      const targetId = Number(query.get("consultationId") || 0);

      if (!targetId || consultations.length === 0) return;

      const target = consultations.find((item) => Number(item.id) === targetId);
      if (!target) return;

      setSelectedConsultation(target);
      markConsultationAsRead(targetId);
      setHighlightedConsultationId(targetId);

      const element = cardRefs.current[targetId];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus({ preventScroll: true });
      }

      const timeoutId = setTimeout(() => setHighlightedConsultationId(null), 1800);
      return () => clearTimeout(timeoutId);
    }, [location.search, consultations]);

    const selectedIsConfirmed = isConfirmedStatus(selectedConsultation?.status);
    const selectedIsCancelled = isCancelledStatus(selectedConsultation?.status);
    const selectedIsPending = isPendingStatus(selectedConsultation?.status);
    const selectedIsCompleted = isCompletedStatus(selectedConsultation?.status);

    return (
      <div className="admin-layout">
        <aside className="sidebar">
          <div className="logo">NGỌC THIỆN ADMIN</div>
          <ul>
            <li><NavLink to="/dashboard"><FaChartPie /> Tổng quan</NavLink></li>
            <li><NavLink to="/qlnguoidung"><FaUsers /> Người dùng</NavLink></li>
            <li><NavLink to="/qlsanpham"><FaBox /> Dịch vụ</NavLink></li>
            <li><NavLink to="/qlhinhanh"><FaImage /> Ảnh trang chủ</NavLink></li>
            <li><NavLink to="/qldonhang"><FaShoppingCart /> Đơn hàng</NavLink></li>
            <li><NavLink to="/qltinnhan"><FaComments /> Tin nhắn</NavLink></li>
            <li><NavLink to="/notification" end><FaBell /> Lịch tư vấn</NavLink></li>
            <li><NavLink to="/lichlamviec"><FaRegCalendarAlt /> Lịch làm việc</NavLink></li>
            <li><NavLink to="/qlhoatdong"><FaHistory /> Lịch sử hoạt động</NavLink></li>
          </ul>
        </aside>

        <div className="main-content">
          <div className="page-header">
            <h2 className="page-title">
              <span className="page-title-icon">📋</span>
              <span>Quản lý lịch tư vấn khách hàng</span>
            </h2>
            <button className="back-btn" onClick={() => navigate(-1)}>
              <FaArrowLeft /> Quay lại
            </button>
          </div>

          <div className="table-container">
            {consultations.length === 0 ? (
              <div className="empty">Không có lịch cần xử lý</div>
            ) : (
              <div className="consultation-grid">
                {consultations.map((item) => {
                  const isConfirmed = isConfirmedStatus(item.status);
                  const isPending = isPendingStatus(item.status);
                  return (
                    <div
                      key={item.id}
                      className={`consultation-card ${highlightedConsultationId === item.id ? "is-targeted" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenDetail(item)}
                      onKeyDown={(e) => e.key === "Enter" && handleOpenDetail(item)}
                      ref={(node) => {
                        if (node) cardRefs.current[item.id] = node;
                      }}
                    >
                      <div className="card-head">
                        <h4>Yêu cầu #{item.id}</h4>
                        {renderStatus(item.status)}
                      </div>

                      <div className="card-body">
                        <p><strong>Khách hàng:</strong> <span>{item.name || "-"}</span></p>
                        <p><strong>Ngày cưới:</strong> <span>{item.event_date ? new Date(item.event_date).toLocaleDateString("vi-VN") : "-"}</span></p>
                        <p><strong>Dịch vụ:</strong> <span>{getServicePreview(item.service)}</span></p>
                        <p><strong>Điện thoại:</strong> <span>{item.phone || "-"}</span></p>
                      </div>

                      <div className="card-foot">
                        {isPending ? (
                          <div className="consult-action-buttons card-actions-inline">
                            <button
                              className="consult-btn consult-btn-cancel"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(item.id, "cancel");
                              }}
                            >
                              <FaTimes /> <span>Hủy lịch</span>
                            </button>
                          </div>
                        ) : isConfirmed ? (
                          <span className="detail-hint">Đã vào quy trình tự động</span>
                        ) : (
                          <span className="detail-hint">Nhấn để xem chi tiết</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedConsultation &&
              createPortal(
                <div className="consult-modal-overlay" onClick={handleCloseDetail}>
                  <div className="consult-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close" type="button" onClick={handleCloseDetail}>
                      ×
                    </button>

                    <div className="card-head modal-head">
                      <h4>Yêu cầu #{selectedConsultation.id}</h4>
                      {renderStatus(selectedConsultation.status)}
                    </div>

                    <div className="card-body modal-body">
                      <p><strong>Khách hàng:</strong> <span>{selectedConsultation.name || "-"}</span></p>
                      <p><strong>Email:</strong> <span>{selectedConsultation.email || "-"}</span></p>
                      <p><strong>Số điện thoại:</strong> <span>{selectedConsultation.phone || "-"}</span></p>
                      <p><strong>Dịch vụ:</strong> <span>{selectedConsultation.service || "-"}</span></p>
                      <p>
                        <strong>Ngày cưới:</strong>{" "}
                        <span>
                          {selectedConsultation.event_date ? new Date(selectedConsultation.event_date).toLocaleDateString("vi-VN") : "-"}
                        </span>
                      </p>
                      <p><strong>Ghi chú:</strong> <span>{selectedConsultation.note || "-"}</span></p>
                    </div>

                    {!selectedIsCancelled && !selectedIsCompleted && (
                      <div className="consult-action-buttons modal-actions">
                        {selectedIsPending && (
                          <button
                            className="consult-btn consult-btn-cancel"
                            type="button"
                            onClick={() => updateStatus(selectedConsultation.id, "cancel")}
                          >
                            <FaTimes /> <span>{selectedIsConfirmed ? "Hủy lịch" : "Hủy"}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>,
                document.body
              )}
          </div>
        </div>
      </div>
    );
  };

export default Notification;
