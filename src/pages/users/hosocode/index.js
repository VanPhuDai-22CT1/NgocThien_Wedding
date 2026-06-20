import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuthItem, logoutAuthSession } from "utils/authStorage";
import {
  FaArrowLeft,
  FaBell,
  FaBox,
  FaChartPie,
  FaCode,
  FaComments,
  FaHistory,
  FaShoppingCart,
  FaSignOutAlt,
  FaUsers,
  FaImage,
} from "react-icons/fa";
import "./style.scss";

const skillGroups = [
  {
    title: "Frontend",
    items: ["ReactJS", "SCSS", "Responsive UI", "UX cơ bản"],
  },
  {
    title: "Backend",
    items: ["PHP", "MySQL", "REST API", "Xử lý dữ liệu"],
  },
  {
    title: "Dev Tools",
    items: ["Git", "VS Code", "XAMPP", "Postman"],
  },
];

const projects = [
  {
    name: "Nền tảng dịch vụ cưới hỏi",
    desc: "Xây dựng website đặt dịch vụ cưới hỏi, quản lý đơn hàng, sản phẩm, ảnh trang chủ và dashboard admin.",
  },
  {
    name: "Module AI đề xuất",
    desc: "Thiết kế hệ thống gợi ý sản phẩm nổi bật cho user và đề xuất tối ưu sản phẩm cho admin.",
  },
  {
    name: "Tối ưu UI/UX hệ thống",
    desc: "Chuẩn hóa giao diện theo hướng hiện đại, trực quan và đồng nhất trải nghiệm trên desktop/mobile.",
  },
];

const CoderProfilePage = () => {
  const navigate = useNavigate();
  const role = getAuthItem("role");

  const logout = () => {
    logoutAuthSession("/");
  };

  return (
    <div className="admin-layout coder-admin-layout">
      <aside className="sidebar">
        <div className="logo">
          <h1>NGOC THIEN</h1>
          <p>Wedding Admin</p>
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

          <NavLink to="/qlhoatdong">
            <FaHistory /> Lịch sử
          </NavLink>

          <NavLink to="/admin/ho-so-nguoi-code" className="active">
            <FaCode /> Hồ sơ người code
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button type="button" onClick={logout} className="logout-btn">
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <div className="admin-header">
          <div>
            <h2>
              <FaCode /> Hồ sơ người code
            </h2>
            <p className="subtitle">Thông tin giới thiệu người phát triển hệ thống.</p>
          </div>

          <button type="button" className="btn-back" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft /> Quay lại Dashboard
          </button>
        </div>

        <section className="coder-profile-page">
          <div className="coder-profile-shell">
            <div className="coder-hero">
              <div className="coder-avatar">VP</div>
              <div className="coder-hero-content">
                <span className="coder-badge">Hồ sơ người code</span>
                <h1>Văn Phú Đại</h1>
                <p>
                  Full-stack developer tập trung vào trải nghiệm người dùng, hiệu năng hệ thống,
                  và khả năng vận hành thực tế cho các sản phẩm thương mại điện tử.
                </p>
              </div>
            </div>

            <div className="coder-grid">
              <div className="coder-card">
                <h3>Giới thiệu</h3>
                <p>
                  Mình theo đuổi định hướng xây dựng sản phẩm web có tính thực chiến: giao diện sạch,
                  nghiệp vụ rõ ràng, và dễ mở rộng khi hệ thống phát triển. Mục tiêu là code gọn, dễ bảo trì,
                  và hỗ trợ tốt cho vận hành lâu dài.
                </p>
              </div>

              <div className="coder-card">
                <h3>Kỹ năng chính</h3>
                <div className="skills-wrap">
                  {skillGroups.map((group) => (
                    <div key={group.title} className="skill-group">
                      <h4>{group.title}</h4>
                      <ul>
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="coder-card coder-card-wide">
                <h3>Dự án nổi bật</h3>
                <div className="project-list">
                  {projects.map((project) => (
                    <article key={project.name} className="project-item">
                      <h4>{project.name}</h4>
                      <p>{project.desc}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="coder-card">
                <h3>Liên hệ</h3>
                <ul className="contact-list">
                  <li>Email: <a href="mailto:vanphudai24122004@gmail.com">vanphudai24122004@gmail.com</a></li>
                  <li>Điện thoại: <a href="tel:0367234139">0367 234 139</a></li>
                  <li>Địa chỉ: Quảng Ngãi, Việt Nam</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CoderProfilePage;
