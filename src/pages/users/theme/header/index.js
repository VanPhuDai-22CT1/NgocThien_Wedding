import React, { memo, useEffect, useRef, useState } from "react";
import "./style.scss";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { FaBars, FaUser } from "react-icons/fa6";
import { FaSearch, FaSignOutAlt } from "react-icons/fa";
import { CgMail } from "react-icons/cg";
import { ROUTERS } from "utils/router";
import { clearAuthSession, getAuthItem } from "utils/authStorage";

// ===== IMPORT áº¢NH HERO =====
import nen1 from "assets/users/images/hero/nen1.jpg";
import nen2 from "assets/users/images/hero/nen2.jpg";
import nen3 from "assets/users/images/hero/nen3.jpg";

const CUSTOMIZE_API = "http://localhost:4000/api/homepage-config";

// ===== DATA =====
const categories = [
  "Thực đơn",
  "Trang trí gia tiên",
  "Mâm quả kết rồng phượng",
  "Cho thuê khung rạp",
  "Dịch vụ bề tráp",
  "Trọn gói ngày cưới",
];

const menus = [
  { name: "Trang chủ", path: ROUTERS.USER.HOME },
  { name: "Dịch vụ", path: ROUTERS.USER.ProductsPage },
  { name: "Thông báo", path: ROUTERS.USER.Notification },
  { name: "Giới thiệu", path: ROUTERS.USER.FreshVeggiesShop },
  { name: "Đơn hàng", path: ROUTERS.USER.OrderDetail },
  { name: "Gói đã chọn", path: ROUTERS.USER.PROFILE },
];

const serviceMenuGroups = [
  {
    title: "Khung rạp",
    items: ["Cho thuê khung rạp", "Trọn gói ngày cưới"],
  },
  {
    title: "Lễ vật - tráp",
    items: ["Dịch vụ bề tráp", "Mâm quả kết rồng phượng"],
  },
  {
    title: "Trang trí - tiệc",
    items: ["Trang trí gia tiên", "Thực đơn"],
  },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showCategories, setShowCategories] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [username, setUsername] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [heroConfig, setHeroConfig] = useState({
    slider: Array(3).fill(""),
    background: "",
  });

  const toSiteImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://localhost:4000/${path.replace(/^\/+/, "")}`;
  };

  const images = [
    toSiteImageUrl(heroConfig.slider[0]) || nen1,
    toSiteImageUrl(heroConfig.slider[1]) || nen2,
    toSiteImageUrl(heroConfig.slider[2]) || nen3,
  ];
  const heroBackground = toSiteImageUrl(heroConfig.background);

  const [currentImage, setCurrentImage] = useState(0);
  const sliderRef = useRef(null);

  const isHome = location.pathname === ROUTERS.USER.HOME;

  /* ================= LOAD USERNAME ================= */
  useEffect(() => {
    const storedUser = getAuthItem("username");
    if (storedUser) setUsername(storedUser);
  }, []);

  /* ================= AUTO SLIDER ================= */
  useEffect(() => {
    axios
      .get(`${CUSTOMIZE_API}?action=getHomepageImages`)
      .then((res) => {
        if (res.data?.success) {
          const data = res.data.data || {};
          const slider = Array.isArray(data.headerSliderImages)
            ? [...data.headerSliderImages, ...Array(3).fill("")].slice(0, 3)
            : Array(3).fill("");

          setHeroConfig({
            slider,
            background: data.heroBackgroundImage || "",
          });
        }
      })
      .catch((err) => {
        console.error("Load header images error:", err);
      });
  }, []);

  useEffect(() => {
    sliderRef.current = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(sliderRef.current);
  }, [images.length]);

  /* ================= SEARCH DEBOUNCE ================= */
  useEffect(() => {
    const delay = setTimeout(() => {
      if (!searchText.trim()) return;

      navigate(
        `${ROUTERS.USER.ProductsPage}?search=${encodeURIComponent(
          searchText
        )}`
      );
    }, 500);

    return () => clearTimeout(delay);
  }, [searchText, navigate]);

  /* ================= CATEGORY CLICK ================= */
  const handleCategoryClick = (category) => {
    navigate(
      `${ROUTERS.USER.ProductsPage}?category=${encodeURIComponent(category)}`
    );
    setShowCategories(false);
  };

  const goToServiceCategory = (category) => {
    navigate(
      `${ROUTERS.USER.ProductsPage}?category=${encodeURIComponent(category)}`
    );
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    clearAuthSession();
    setUsername("");
    setShowUserMenu(false);
    navigate(ROUTERS.USER.HOME);
  };

  return (
    <>
      {/* ===== HEADER TOP ===== */}
      <div className="header__top">
        <div className="header__top-inner">
          <div className="header__top-left">
            <CgMail />
            {username ? (
              <span>Xin chào, {username}</span>
            ) : (
              <span>Dịch vụ cưới hỏi Ngọc Thiện 💍</span>
            )}
          </div>

          <div className="header__top-right">
            {username ? (
              <div className="user-dropdown">
                <div
                  className="user-icon"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <FaUser />
                </div>

                {showUserMenu && (
                  <div className="user-menu">
                    <button
                      onClick={() => {
                        navigate(ROUTERS.USER.CustomerInfo);
                        setShowUserMenu(false);
                      }}
                    >
                      <FaUser /> Xem thông tin
                    </button>

                    <button onClick={handleLogout}>
                      <FaSignOutAlt /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to={ROUTERS.USER.LOGIN} className="login-btn">
                <FaUser /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ===== HEADER MAIN ===== */}
      <header className="header__main">
        <div className="header__main-inner">
          <Link to={ROUTERS.USER.HOME} className="header__logo">
            NGỌC THIỆN
          </Link>

          <nav className="header__menu">
            <ul>
              {menus.map((m) => {
                const isServiceMenu = m.name === "Dịch vụ";

                if (!isServiceMenu) {
                  return (
                    <li key={m.name}>
                      <Link to={m.path}>{m.name}</Link>
                    </li>
                  );
                }

                return (
                  <li key={m.name} className="menu-item menu-item--services">
                    <Link to={m.path}>{m.name}</Link>

                    <div className="service-dropdown">
                      {serviceMenuGroups.map((group) => (
                        <div key={group.title} className="service-dropdown__group">
                          <h4>{group.title}</h4>
                          <ul>
                            {group.items.map((item) => (
                              <li key={item}>
                                <button
                                  type="button"
                                  onClick={() => goToServiceCategory(item)}
                                >
                                  {item}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* SEARCH TOOL REALTIME */}
          <div className="header__search">
            <input
              placeholder="Tìm kiếm dịch vụ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button type="button">
              <FaSearch />
            </button>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      {isHome && (
        <section className="hero">
          <div className="hero__inner">
            <aside className="hero__categories">
              <div
                className="hero__categories__all"
                onClick={() => setShowCategories(!showCategories)}
              >
                <FaBars /> Danh Sách Dịch Vụ
              </div>

              {showCategories && (
                <ul>
                  {categories.map((c) => (
                    <li key={c} onClick={() => handleCategoryClick(c)}>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <div
              className="hero__main"
              style={
                heroBackground
                  ? {
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${heroBackground})`,
                      backgroundPosition: "20% 15%",
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                    }
                  : undefined
              }
            >
              <div className="hero__content">
                <span className="hero__badge">
                  💍 Trọn gói cưới hỏi
                </span>
                <h2 className="wedding-title">
                  Ngọc Thiện Wedding
                </h2>

                <button
                  className="btn-3d"
                  onClick={() =>
                    navigate(ROUTERS.USER.ProductsPage)
                  }
                >
                  <span className="shadow"></span>
                  <span className="edge"></span>
                  <span className="front text">
                    Xem dịch vụ
                  </span>
                </button>
              </div>

              <div className="hero__image">
                <img
                  src={images[currentImage]}
                  alt="Ngọc Thiện Wedding"
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default memo(Header);
