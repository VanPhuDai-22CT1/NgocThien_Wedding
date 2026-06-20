import React, { useState, useEffect } from "react";
import "./style.scss";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import { getAuthItem, logoutAuthSession } from "utils/authStorage";
import { getDarkMode, setDarkModeStorage } from "utils/darkMode";
import {
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaCreditCard,
  FaChartBar,
  FaChartPie,
  FaDownload,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaHistory,
  FaBell,
  FaComments,
  FaImage,
  FaRegCalendarAlt
} from "react-icons/fa";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const API = `${process.env.REACT_APP_API_URL || "/api"}/legacy`;

const Statistics = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => getDarkMode());
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    completed_orders: 0,
    pending_orders: 0,
    cancelled_orders: 0,
    online_payments: 0,
    online_payment_revenue: 0,
    online_payment_rate: 0,
    months: [],
    monthly_revenue: []
  });

  const [selectedExportType, setSelectedExportType] = useState("day");

  useEffect(() => {
    const user = getAuthItem("username");
    const role = getAuthItem("role");

    if (!user) {
      navigate("/");
      return;
    }

    if (role && role !== "admin") {
      navigate("/");
      return;
    }

    setUsername(user);
    fetchStats();
  }, [navigate]);

  useEffect(() => {
    setDarkModeStorage(darkMode);
  }, [darkMode]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get(`/legacy`, { params: { action: "getDashboardStats" }, headers: buildAuthHeaders() });
      const data = response.data;

      if (data && data.success !== false) {
        setStats(data);
      }
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
    }
  };

  const exportExcel = (type) => {
    (async () => {
      try {
        const res = await apiClient.get(`/legacy`, { params: { action: 'exportStatistics', type }, responseType: 'blob', headers: buildAuthHeaders() });
        const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${type}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Export error', err);
        alert('Không thể xuất dữ liệu');
      }
    })();
  };

  const formatMoney = (money) => {
    return new Intl.NumberFormat("vi-VN").format(money || 0) + " đ";
  };

  const barData = {
    labels: stats.months || [],
    datasets: [
      {
        label: "Doanh thu năm nay",
        data: stats.monthly_revenue || [],
        backgroundColor: "#c2185b",
        borderRadius: 8,
        hoverBackgroundColor: "#ad1d5a"
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "center",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 18,
          boxWidth: 10,
          color: darkMode ? "#f3f4f6" : "#4b5563",
          font: {
            size: 13,
            weight: "600"
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: darkMode ? "#d1d5db" : "#6b7280"
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: darkMode ? "#d1d5db" : "#6b7280"
        },
        grid: {
          color: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
        }
      }
    }
  };

  const orderStatusData = {
    labels: ["Hoàn thành", "Đang xử lý", "Hủy"],
    datasets: [
      {
        data: [
          stats.completed_orders || 0,
          stats.pending_orders || 0,
          stats.cancelled_orders || 0
        ],
        backgroundColor: ["#4caf50", "#ff9800", "#f44336"],
        borderColor: ["#45a049", "#e68900", "#da190b"],
        borderWidth: 2
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 8,
        right: 8,
        bottom: 8,
        left: 8
      }
    },
    plugins: {
      legend: {
        position: "top",
        align: "center",
        labels: {
          usePointStyle: true,
          pointStyle: "rectRounded",
          padding: 20,
          boxWidth: 18,
          color: darkMode ? "#f3f4f6" : "#4b5563",
          font: {
            size: 13,
            weight: "600"
          }
        }
      }
    }
  };

  const logout = () => {
    logoutAuthSession("/");
  };

  return (
    <div className={`statistics-page dashboard-layout ${darkMode ? "dark-mode" : ""}`}>
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-title">NGỌC THIỆN</span>
          <span className="logo-title">ADMIN</span>
          <span className="logo-subtitle">WEDDING</span>
        </div>

        <ul>
          <li>
            <NavLink to="/dashboard">
              <FaChartPie /> Tổng quan
            </NavLink>
          </li>

          <li>
            <NavLink to="/qlnguoidung">
              <FaUsers /> Người dùng
            </NavLink>
          </li>

          <li>
            <NavLink to="/qlsanpham">
              <FaBox /> Dịch vụ
            </NavLink>
          </li>

          <li>
            <NavLink to="/qlhinhanh">
              <FaImage /> Ảnh trang chủ
            </NavLink>
          </li>

          <li>
            <NavLink to="/qldonhang">
              <FaShoppingCart /> Đơn hàng
            </NavLink>
          </li>

          <li>
            <NavLink to="/qltinnhan">
              <FaComments /> Tin nhắn
            </NavLink>
          </li>

          <li>
            <NavLink to="/notification">
              <FaBell /> Lịch tư vấn
            </NavLink>
          </li>

          <li>
            <NavLink to="/lichlamviec">
              <FaRegCalendarAlt /> Lịch làm việc
            </NavLink>
          </li>

          <li>
            <NavLink to="/qlhoatdong">
              <FaHistory /> Lịch sử hoạt động
            </NavLink>
          </li>

        </ul>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">Thống kê & Xuất dữ liệu</h2>

          <div className="top-actions">
            <button
              className="dark-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title="Chuyển đổi chế độ tối"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>

            <span className="username">
              Xin chào <b>{username}</b>
            </span>

            <button className="logout-btn" onClick={logout} title="Đăng xuất">
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        <main className="statistics-content">
        {/* STATS GRID */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users">
              <span>👥</span>
            </div>
            <div className="stat-content">
              <h4>Người dùng</h4>
              <h2>{stats.total_users}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <span>📦</span>
            </div>
            <div className="stat-content">
              <h4>Dịch vụ</h4>
              <h2>{stats.total_products}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orders">
              <span>🛍️</span>
            </div>
            <div className="stat-content">
              <h4>Đơn hàng</h4>
              <h2>{stats.total_orders}</h2>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon revenue">
              <span>💰</span>
            </div>
            <div className="stat-content">
              <h4>Doanh thu</h4>
              <h2>{formatMoney(stats.total_revenue)}</h2>
            </div>
          </div>

          <div className="stat-card online-payment-card">
            <div className="stat-icon online">
              <FaCreditCard />
            </div>
            <div className="stat-content">
              <h4>Thanh toán online</h4>
              <h2>{stats.online_payments || 0}</h2>
              <p className="online-payment-meta">
                {formatMoney(stats.online_payment_revenue || 0)} • {stats.online_payment_rate || 0}% đơn
              </p>
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="charts-section">
          <div className="chart-container">
            <div className="chart-header">
              <div className="chart-title-group">
                <h3><FaChartBar /> Doanh thu theo tháng</h3>
                <p>Theo dõi biến động doanh thu từng tháng trong năm hiện tại.</p>
              </div>
              <div className="chart-meta">
                <span>{stats.months?.length || 0} tháng</span>
              </div>
            </div>
            <div className="chart-body">
              <div className="chart-wrapper">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          <div className="chart-container chart-container--pie">
            <div className="chart-header">
              <div className="chart-title-group">
                <h3><FaChartPie /> Trạng thái đơn hàng</h3>
                <p>Hiển thị tỷ lệ hoàn thành, đang xử lý và hủy để theo dõi nhanh.</p>
              </div>
              <div className="chart-meta">
                <span>{stats.total_orders || 0} đơn</span>
              </div>
            </div>
            <div className="chart-body chart-body--centered">
              <div className="chart-wrapper chart-wrapper--pie">
                <Pie data={orderStatusData} options={pieOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* EXPORT SECTION */}
        <div className="export-section">
          <div className="export-card">
            <h3><FaDownload /> Xuất dữ liệu thống kê</h3>

            <div className="export-info">
              <p>Chọn kiểu xuất dữ liệu và nhấn nút để tải file CSV:</p>
            </div>

            <div className="export-options">
              <div className="option-group">
                <label htmlFor="export-type">Loại xuất:</label>
                <select
                  id="export-type"
                  value={selectedExportType}
                  onChange={(e) => setSelectedExportType(e.target.value)}
                >
                  <option value="day">📅 Xuất theo ngày</option>
                  <option value="month">📆 Xuất theo tháng</option>
                  <option value="year">📊 Xuất theo năm</option>
                  <option value="quarter">📈 Xuất theo quý</option>
                </select>
              </div>

              <button
                className="export-btn primary"
                onClick={() => exportExcel(selectedExportType)}
                title="Tải file CSV"
              >
                <FaDownload /> Tải ngay
              </button>
            </div>

            <div className="export-buttons-grid">
              <h4>Hoặc xuất nhanh:</h4>
              <div className="quick-buttons">
                <button
                  className="quick-btn day"
                  onClick={() => exportExcel("day")}
                  title="Xuất theo ngày"
                >
                  <span>📅</span>
                  <span>Ngày</span>
                </button>
                <button
                  className="quick-btn month"
                  onClick={() => exportExcel("month")}
                  title="Xuất theo tháng"
                >
                  <span>📆</span>
                  <span>Tháng</span>
                </button>
                <button
                  className="quick-btn year"
                  onClick={() => exportExcel("year")}
                  title="Xuất theo năm"
                >
                  <span>📊</span>
                  <span>Năm</span>
                </button>
                <button
                  className="quick-btn quarter"
                  onClick={() => exportExcel("quarter")}
                  title="Xuất theo quý"
                >
                  <span>📈</span>
                  <span>Quý</span>
                </button>
              </div>
            </div>

            <div className="export-help">
              <p><strong>📝 Ghi chú:</strong> Dữ liệu sẽ được tải dưới dạng file CSV (định dạng bảng tính). Bạn có thể mở nó bằng Excel hoặc Google Sheets.</p>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
};

export default Statistics;
