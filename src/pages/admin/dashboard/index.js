import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { clearAuthSession, getAuthItem } from "utils/authStorage";
import { getDarkMode, setDarkModeStorage } from "utils/darkMode";

import {
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaChartPie,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaHistory,
  FaBell,
  FaComments,
  FaImage,
  FaRobot,
  FaChevronLeft,
  FaChevronRight,
  FaRegCalendarAlt
} from "react-icons/fa";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const API = `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/legacy`;
const WEEK_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const Dashboard = () => {

  const navigate = useNavigate();

  /* ================= STATE ================= */

  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    completed_orders: 0,
    pending_orders: 0,
    cancelled_orders: 0,
    months: [],
    monthly_revenue: []
  });

  const [consultations, setConsultations] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [darkMode, setDarkMode] = useState(() => getDarkMode());
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState("");

  const toDateKey = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const normalizedConsultations = useMemo(() => {
    return (consultations || [])
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
      if (!map[item.dateKey]) {
        map[item.dateKey] = [];
      }
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

  const currentMonthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth]);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstEventInMonth = normalizedConsultations
      .filter((item) => item.dateObject && item.dateObject.getFullYear() === year && item.dateObject.getMonth() === month)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))[0];

    if (firstEventInMonth) {
      setSelectedDateKey(firstEventInMonth.dateKey);
      return;
    }

    const firstDayKey = toDateKey(new Date(year, month, 1));
    setSelectedDateKey(firstDayKey);
  }, [currentMonth, normalizedConsultations]);

  useEffect(() => {
    setDarkModeStorage(darkMode);
  }, [darkMode]);

  /* ================= LOAD USER ================= */

  useEffect(() => {

    const storedUser = getAuthItem("username");
    const storedRole = getAuthItem("role");

    if (!storedUser) {
      navigate("/");
      return;
    }

    setUsername(storedUser);
    setRole(storedRole);

    loadDashboard();
    loadConsultations();
    loadAiSuggestions();
    loadUpcomingEvents();

  }, [navigate]);

  /* ================= LOAD DASHBOARD ================= */

  const loadDashboard = async () => {

    try {

      const res = await apiClient.post(
        "/legacy",
        { action: "getDashboardStats" },
        { headers: buildAuthHeaders() }
      );

      const data = res?.data;
      if (data && data.success !== false) {
        setStats(data);
      }

    } catch (error){
      console.log("Dashboard error:",error);
    }

  };

  const loadAiSuggestions = async () => {
    try {
      setAiLoading(true);
      const res = await apiClient.get(`/legacy?action=getAdminAiSuggestions&limit=3`, {
        headers: buildAuthHeaders(),
      });
      const data = res?.data;
      if (data?.success) {
        setAiSuggestions(Array.isArray(data.data) ? data.data : []);
      } else {
        setAiSuggestions([]);
      }
    } catch (error) {
      console.log("AI suggestion error:", error);
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  /* ================= LOAD CONSULT ================= */

  const loadConsultations = async () => {

    try {

      const res = await apiClient.get(`/legacy?action=getConsultations`, { headers: buildAuthHeaders() });
      const data = res?.data;
      if (data?.success) {
        setConsultations(data.data || []);
      }

    } catch(error){
      console.log("Consult error:",error);
    }

  };

  /* ================= LOAD UPCOMING EVENTS ================= */

  const loadUpcomingEvents = async () => {
    try {
      const res = await apiClient.get(`/legacy?action=getUpcomingEvents`, { headers: buildAuthHeaders() });
      const data = res?.data;

      if (data?.success && Array.isArray(data.data)) {
        const upcomingEvents = data.data;
        
        // Show toast notification for each upcoming event
        upcomingEvents.forEach((event) => {
          const eventDate = new Date(event.event_date);
          const formattedDate = eventDate.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          });
          
          toast.warning(
            `📍 Sự kiện sắp tới: ${event.name || event.service}\nNgày: ${formattedDate}`,
            {
              position: "top-right",
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
        });
      }
    } catch (error) {
      console.log("Upcoming events error:", error);
    }
  };

  /* ================= LOGOUT ================= */

  const logout = () => {

    clearAuthSession();
    navigate("/");

  };

  /* ================= MONEY ================= */

  const formatMoney = (money) => {
    return new Intl.NumberFormat("vi-VN").format(money || 0) + " đ";
  };

  /* ================= BAR CHART ================= */

  const barData = {

    labels: stats.months,

    datasets:[
      {
        label:"Doanh thu năm nay",
        data: stats.monthly_revenue,
        backgroundColor:"#c2185b",
        borderRadius:8
      }
    ]

  };

  /* ================= PIE ================= */

  const pieData = {

    labels:["Đã giao sự kiện","Đang xử lý/Đang giao","Hủy đơn"],

    datasets:[
      {
        data:[
          stats.completed_orders,
          stats.pending_orders,
          stats.cancelled_orders
        ],
        backgroundColor:[
          "#4caf50",
          "#ff9800",
          "#f44336"
        ]
      }
    ]

  };

  /* ================= RENDER ================= */

  return (

    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className={`dashboard-layout ${darkMode ? "dark":""}`}>

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <span className="logo-title">NGỌC THIỆN</span>
          <span className="logo-title">ADMIN</span>
          <span className="logo-subtitle">WEDDING</span>
        </div>

        <ul>

          <li>
            <NavLink to="/dashboard">
              <FaChartPie/> Tổng quan
            </NavLink>
          </li>

          {role==="admin" && (
            <li>
              <NavLink to="/qlnguoidung">
                <FaUsers/> Người dùng
              </NavLink>
            </li>
          )}

          <li>
            <NavLink to="/qlsanpham">
              <FaBox/> Dịch vụ
            </NavLink>
          </li>

          <li>
            <NavLink to="/qlhinhanh">
              <FaImage/> Ảnh trang chủ
            </NavLink>
          </li>

          <li>
            <NavLink to="/qldonhang">
              <FaShoppingCart/> Đơn hàng
            </NavLink>
          </li>

          <li>
            <NavLink to="/qltinnhan">
              <FaComments/> Tin nhắn
            </NavLink>
          </li>

          <li>
            <NavLink to="/notification">
              <FaBell/> Lịch tư vấn
            </NavLink>
          </li>

          <li>
            <NavLink to="/lichlamviec">
              <FaRegCalendarAlt/> Lịch làm việc
            </NavLink>
          </li>

          <li>
            <NavLink to="/qlhoatdong">
              <FaHistory/> Lịch sử hoạt động
            </NavLink>
          </li>

          <li className="statistics-menu">
            <NavLink to="/thong-ke">
              <FaChartPie/> Thống kê
            </NavLink>
          </li>

          <li>
            <NavLink to="/admin/ho-so-nguoi-code">
              <FaUsers/> Hộ sơ người code
            </NavLink>
          </li>

        </ul>

      </aside>

      {/* MAIN */}

      <div className="main-content">

        {/* TOPBAR */}

        <header className="topbar">

          <h2>Bảng điều khiển</h2>

          <div className="top-actions">

            <button
              className="dark-toggle"
              onClick={()=>setDarkMode(!darkMode)}
            >
              {darkMode ? <FaSun/> : <FaMoon/>}
            </button>

            <span className="username">
              Xin chào <b>{role === "admin" ? "Admin" : (username || "bạn")}</b>
            </span>

            <button onClick={logout}>
              <FaSignOutAlt/>
            </button>

          </div>

        </header>

        {/* STATS */}

        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon users">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h4>Người dùng</h4>
              <h2>{stats.total_users}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <FaBox />
            </div>
            <div className="stat-content">
              <h4>Dịch vụ</h4>
              <h2>{stats.total_products}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orders">
              <FaShoppingCart />
            </div>
            <div className="stat-content">
              <h4>Đơn hàng</h4>
              <h2>{stats.total_orders}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon consult">
              <FaBell />
            </div>
            <div className="stat-content">
              <h4>Lịch tư vấn</h4>
              <h2>{consultations.length}</h2>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon revenue">
              <FaChartPie />
            </div>
            <div className="stat-content">
              <h4>Doanh thu</h4>
              <h2>{formatMoney(stats.total_revenue)}</h2>
              <div className="revenue-badge">🔥 Nổi bật</div>
            </div>
          </div>

        </div>

        {/* CHART */}

        <div className="charts">

          <div className="chart-box">
            <h3>Doanh thu theo tháng</h3>
            <Bar data={barData}/>
          </div>

          <div className="chart-box">
            <h3>Tỷ lệ đơn hàng</h3>
            <Pie data={pieData}/>
          </div>

        </div>

        <div className="work-schedule-box">
          <div className="calendar-panel">
            <div className="calendar-head">
              <h3><FaRegCalendarAlt /> Lịch làm việc theo tháng</h3>
              <div className="month-nav">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth((prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                >
                  <FaChevronLeft />
                </button>
                <span>{currentMonthLabel}</span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth((prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                >
                  <FaChevronRight />
                </button>
              </div>
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
                  </button>
                );
              })}
            </div>
          </div>

          <div className="schedule-panel">
            <div className="schedule-head">
              <h3>Thời khóa biểu tiếc</h3>
              <span>
                {selectedDateKey
                  ? new Date(selectedDateKey).toLocaleDateString("vi-VN")
                  : "Chưa chọn ngày"}
              </span>
            </div>

            {selectedScheduleItems.length === 0 ? (
              <div className="schedule-empty">
                Ngày này chưa có lịch tiếc.
              </div>
            ) : (
              <div className="schedule-list">
                {selectedScheduleItems.map((item) => (
                  <div className="schedule-card" key={`sch-${item.id}`}>
                    <div className="title-row">
                      <strong>{item.name || "Khách hàng"}</strong>
                      <span>{item.service || "Chưa chọn dịch vụ"}</span>
                    </div>
                    <div className="meta-row">
                      <span>📞 {item.phone || "Chưa có số điện thoại"}</span>
                      <span>📍 {item.address || "Chưa có địa điểm"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ai-box">
          <div className="ai-box-header">
            <h3><FaRobot /> AI đề xuất tối ưu sản phẩm</h3>
            <span>Dựa trên tần suất sử dụng + tỉ lệ hoàn tất đơn</span>
          </div>

          {aiLoading ? (
            <div className="ai-empty">Đang phân tích dữ liệu sản phẩm...</div>
          ) : aiSuggestions.length === 0 ? (
            <div className="ai-empty">Chưa có dữ liệu đơn hàng đủ để AI đề xuất.</div>
          ) : (
            <div className="ai-grid">
              {aiSuggestions.map((item) => (
                <div className="ai-card" key={`${item.product_name}-${item.product_id || "name"}`}>
                  <div className="ai-card-top">
                    <div className="ai-thumb">
                      {item.cover ? (
                        <img
                          src={`http://localhost:4000/uploads/${item.cover}`}
                          alt={item.product_name}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>{item.product_name?.charAt(0) || "S"}</span>
                      )}
                    </div>

                    <div className="ai-info">
                      <h4>{item.product_name}</h4>
                      <p>AI score: {Number(item.ai_score || 0).toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="ai-metrics">
                    <div>
                      <span>Đã dùng</span>
                      <b>{item.total_quantity}</b>
                    </div>
                    <div>
                      <span>Tỉ lệ hoàn tất</span>
                      <b>{item.completion_rate}%</b>
                    </div>
                    <div>
                      <span>Đánh giá</span>
                      <b>{Number(item.average_rating || 0).toFixed(1)} ⭐</b>
                    </div>
                  </div>

                  <div className="ai-progress-wrap">
                    <div className="ai-progress-label">
                      <span>Mức hoàn tất</span>
                      <b>{item.completion_rate}%</b>
                    </div>
                    <div className="ai-progress-bar">
                      <div
                        className="ai-progress-value"
                        style={{ width: `${Math.min(Math.max(Number(item.completion_rate || 0), 0), 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="ai-action">{item.ai_action}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONSULT */}

        <div className="consultation-box">

          <div className="consultation-head">
            <h3>Lịch tư vấn mới</h3>
            <span className="consultation-note">Hiển thị 3 lịch gần nhất</span>
          </div>

          <div className="consult-grid">

            {consultations.slice(0, 3).map(item=>(
              
              <div
                key={item.id}
                className="consult-card clickable"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/notification?consultationId=${item.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/notification?consultationId=${item.id}`);
                  }
                }}
              >

                <div className="avatar">
                  {item.name?.charAt(0)}
                </div>

                <div className="info">
                  <div className="name">
                    {item.name || "Khách hàng"}
                  </div>
                  <div className="service">
                    {item.service || "Chưa chọn dịch vụ"}
                  </div>
                </div>

                <div className="date">
                  {item.event_date
                    ? new Date(item.event_date).toLocaleDateString("vi-VN")
                    : "Chưa chọn ngày"}
                </div>

              </div>

            ))}

          </div>

        </div>
      </div>

    </div>
    </>

  );

};

export default Dashboard;
