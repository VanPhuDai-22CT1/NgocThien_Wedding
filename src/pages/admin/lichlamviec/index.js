import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuthItem, clearAuthSession } from "utils/authStorage";
import {
  FaArrowLeft,
  FaBell,
  FaBox,
  FaChartPie,
  FaComments,
  FaHistory,
  FaImage,
  FaRegCalendarAlt,
  FaShoppingCart,
  FaSignOutAlt,
  FaUsers,
} from "react-icons/fa";
import "./style.scss";

const API = `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/legacy`;
const WEEK_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const toDateKey = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function WorkScheduleManagement() {
  const navigate = useNavigate();
  const role = getAuthItem("role");

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState("");

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setApiError("");
      const res = await fetch(`${API}?action=getConsultations`);

      const rawText = await res.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        const preview = String(rawText || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 120);

        throw new Error(
          preview
            ? `API không trả JSON hợp lệ. Nội dung nhận được: ${preview}`
            : "API không trả JSON hợp lệ."
        );
      }

      if (!res.ok) {
        throw new Error(data?.message || `Lỗi HTTP ${res.status}`);
      }

      if (data?.success) {
        setConsultations(Array.isArray(data.data) ? data.data : []);
      } else {
        setApiError(data?.message || "Không thể tải dữ liệu lịch làm việc.");
        setConsultations([]);
      }
    } catch (error) {
      console.log("Load schedule error:", error);
      setApiError(error?.message || "Không thể tải dữ liệu lịch làm việc.");
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  const normalizedConsultations = useMemo(() => {
    return consultations
      .map((item) => {
        const dateKey = toDateKey(item.event_date);
        return {
          ...item,
          dateKey,
          dateObject: dateKey ? new Date(item.event_date) : null,
        };
      })
      .filter((item) => item.dateKey);
  }, [consultations]);

  const eventsByDate = useMemo(() => {
    const map = {};
    normalizedConsultations.forEach((item) => {
      if (!map[item.dateKey]) map[item.dateKey] = [];
      map[item.dateKey].push(item);
    });
    return map;
  }, [normalizedConsultations]);

  const monthGridDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstWeekday; i++) {
      days.push({ type: "empty", key: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = toDateKey(date);
      days.push({
        type: "day",
        key: dateKey,
        day,
        dateKey,
        eventCount: (eventsByDate[dateKey] || []).length,
      });
    }

    return days;
  }, [currentMonth, eventsByDate]);

  const selectedScheduleItems = useMemo(() => {
    if (!selectedDateKey) return [];
    return eventsByDate[selectedDateKey] || [];
  }, [eventsByDate, selectedDateKey]);

  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const itemsInMonth = normalizedConsultations.filter(
      (item) =>
        item.dateObject &&
        item.dateObject.getFullYear() === year &&
        item.dateObject.getMonth() === month
    );

    const activeDays = new Set(itemsInMonth.map((item) => item.dateKey)).size;

    return {
      totalEvents: itemsInMonth.length,
      activeDays,
    };
  }, [currentMonth, normalizedConsultations]);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstEventInMonth = normalizedConsultations
      .filter(
        (item) =>
          item.dateObject &&
          item.dateObject.getFullYear() === year &&
          item.dateObject.getMonth() === month
      )
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))[0];

    if (firstEventInMonth) {
      setSelectedDateKey(firstEventInMonth.dateKey);
      return;
    }

    setSelectedDateKey(toDateKey(new Date(year, month, 1)));
  }, [currentMonth, normalizedConsultations]);

  const currentMonthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth]);

  const logout = () => {
    clearAuthSession();
    navigate("/");
  };

  return (
    <div className="work-calendar-admin">
      <aside className="sidebar">
        <div className="logo">NGỌC THIỆN ADMIN</div>

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

          <NavLink to="/qlhinhanh">
            <FaImage /> Ảnh trang chủ
          </NavLink>

          <NavLink to="/qldonhang">
            <FaShoppingCart /> Đơn hàng
          </NavLink>

          <NavLink to="/qltinnhan">
            <FaComments /> Tin nhắn
          </NavLink>

          <NavLink to="/notification">
            <FaBell /> Lịch tư vấn
          </NavLink>

          <NavLink to="/lichlamviec" className="active">
            <FaRegCalendarAlt /> Lịch làm việc
          </NavLink>

          <NavLink to="/qlhoatdong">
            <FaHistory /> Lịch sử
          </NavLink>

          <NavLink to="/thong-ke">
            <FaChartPie /> Thống kê
          </NavLink>

          <NavLink to="/admin/ho-so-nguoi-code">
            <FaUsers /> Hồ sơ người code
          </NavLink>
        </nav>

        <button type="button" className="logout-btn" onClick={logout}>
          <FaSignOutAlt /> Đăng xuất
        </button>
      </aside>

      <main className="content">
        <div className="page-head">
          <div className="page-head-copy">
            <h2>📅 Lịch làm việc theo tháng</h2>
            <p>Theo dõi nhanh các lịch đặt tiệc trong tháng và xem chi tiết theo từng ngày.</p>
          </div>
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft /> Quay lại
          </button>
        </div>

        <div className="schedule-summary">
          <div className="summary-card">
            <span>Lịch trong tháng</span>
            <strong>{monthStats.totalEvents}</strong>
          </div>
          <div className="summary-card">
            <span>Ngày có tiệc</span>
            <strong>{monthStats.activeDays}</strong>
          </div>
          <div className="summary-card accent">
            <span>Ngày đang chọn</span>
            <strong>
              {selectedDateKey
                ? new Date(selectedDateKey).toLocaleDateString("vi-VN")
                : "Chưa chọn"}
            </strong>
          </div>
        </div>

        <div className="schedule-layout">
          <section className="calendar-panel">
            <div className="calendar-head">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
              >
                ‹
              </button>
              <h3>{currentMonthLabel}</h3>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
              >
                ›
              </button>
            </div>

            <div className="panel-note">
              Chọn ngày trên lịch để xem danh sách tiệc đã được đặt.
            </div>

            <div className="weekdays-row">
              {WEEK_DAYS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="days-grid">
              {monthGridDays.map((item) => {
                if (item.type === "empty") {
                  return <div key={item.key} className="day-cell empty" />;
                }

                const isSelected = selectedDateKey === item.dateKey;
                const isToday = item.dateKey === toDateKey(new Date());

                return (
                  <button
                    type="button"
                    key={item.key}
                    className={`day-cell ${item.eventCount > 0 ? "has-event" : ""} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                    onClick={() => setSelectedDateKey(item.dateKey)}
                  >
                    <span className="day-number">{item.day}</span>
                    {item.eventCount > 0 && (
                      <span className="event-count">{item.eventCount}</span>
                    )}
                    {item.eventCount > 0 && <span className="event-dot" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="timeline-panel">
            <div className="timeline-head">
              <h3>Lịch đặt tiệc</h3>
              <span>
                {selectedDateKey
                  ? new Date(selectedDateKey).toLocaleDateString("vi-VN")
                  : "Chưa chọn ngày"}
              </span>
            </div>

            {loading ? (
              <div className="empty">Đang tải dữ liệu...</div>
            ) : apiError ? (
              <div className="empty">{apiError}</div>
            ) : selectedScheduleItems.length === 0 ? (
              <div className="empty">Ngày này chưa có lịch tiệc.</div>
            ) : (
              <div className="timeline-list">
                {selectedScheduleItems.map((item) => (
                  <article className="timeline-card" key={`schedule-${item.id}`}>
                    <div className="title-row">
                      <div>
                        <strong>{item.name || "Khách hàng"}</strong>
                        <div className="service-name">{item.service || "Chưa chọn dịch vụ"}</div>
                      </div>
                      <span className={`status-badge ${String(item.status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
                        {item.status || "Chờ xử lý"}
                      </span>
                    </div>
                    <div className="meta-grid">
                      <div className="meta"><label>Điện thoại</label><span>{item.phone || "Chưa có số điện thoại"}</span></div>
                      <div className="meta"><label>Địa điểm</label><span>{item.address || "Chưa có địa điểm"}</span></div>
                      <div className="meta full"><label>Ghi chú</label><span>{item.note || "Không có ghi chú"}</span></div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
