import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthItem } from "utils/authStorage";
import {
  FaBell,
  FaBox,
  FaComments,
  FaChartPie,
  FaHistory,
  FaHome,
  FaImage,
  FaRegCalendarAlt,
  FaShoppingCart,
  FaSignOutAlt,
  FaUpload,
  FaUsers,
} from "react-icons/fa";
import "./style.scss";

import nennb1 from "assets/users/images/hero/a1.jpg";
import nennb2 from "assets/users/images/hero/a2.jpg";
import nennb3 from "assets/users/images/hero/a3.jpg";
import nennb4 from "assets/users/images/hero/a4.jpg";
import nennb5 from "assets/users/images/hero/a5.jpg";
import nennb6 from "assets/users/images/hero/a6.jpg";
import nennb7 from "assets/users/images/hero/a7.jpg";
import nen1 from "assets/users/images/hero/nen1.jpg";
import nen2 from "assets/users/images/hero/nen2.jpg";
import nen3 from "assets/users/images/hero/nen3.jpg";
import heroBgDefault from "assets/users/images/hero/nennen.jpg";

const API = "http://localhost:4000/api/homepage-config";

const HomeImageManagement = () => {
  const navigate = useNavigate();
  const role = getAuthItem("role");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    galleryImages: Array(7).fill(""),
    consultImage: "",
    headerSliderImages: Array(3).fill(""),
    heroBackgroundImage: "",
    updatedAt: null,
  });

  const [files, setFiles] = useState({
    gallery: Array(7).fill(null),
    consult: null,
    headerSlider: Array(3).fill(null),
    heroBackground: null,
  });

  const [previews, setPreviews] = useState({
    gallery: Array(7).fill(""),
    consult: "",
    headerSlider: Array(3).fill(""),
    heroBackground: "",
  });

  const [history, setHistory] = useState({
    gallery: Array(7).fill(null).map(() => []),
    consult: [],
    headerSlider: Array(3).fill(null).map(() => []),
    heroBackground: [],
  });

  const [pathOverrides, setPathOverrides] = useState({
    gallery: Array(7).fill(""),
    consult: "",
    headerSlider: Array(3).fill(""),
    heroBackground: "",
  });

  const defaultGalleryImages = [
    nennb1,
    nennb2,
    nennb3,
    nennb4,
    nennb5,
    nennb6,
    nennb7,
  ];

  const defaultHeaderSliderImages = [nen1, nen2, nen3];

  const toImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://localhost:4000/${path.replace(/^\/+/, "")}`;
  };

  const normalizeHistory = (source) => {
    const gallerySource = Array.isArray(source?.gallery) ? source.gallery : [];
    const headerSource = Array.isArray(source?.headerSlider) ? source.headerSlider : [];

    const gallery = Array.from({ length: 7 }, (_, idx) => {
      const list = Array.isArray(gallerySource[idx]) ? gallerySource[idx] : [];
      return list.filter((item) => typeof item === "string" && item.trim() !== "");
    });

    const headerSlider = Array.from({ length: 3 }, (_, idx) => {
      const list = Array.isArray(headerSource[idx]) ? headerSource[idx] : [];
      return list.filter((item) => typeof item === "string" && item.trim() !== "");
    });

    return {
      gallery,
      consult: Array.isArray(source?.consult)
        ? source.consult.filter((item) => typeof item === "string" && item.trim() !== "")
        : [],
      headerSlider,
      heroBackground: Array.isArray(source?.heroBackground)
        ? source.heroBackground.filter((item) => typeof item === "string" && item.trim() !== "")
        : [],
    };
  };

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}?action=getHomepageImages`);
      if (res.data?.success) {
        const data = res.data.data || {};
        const gallery = Array.isArray(data.galleryImages)
          ? [...data.galleryImages, ...Array(7).fill("")].slice(0, 7)
          : Array(7).fill("");
        const headerSlider = Array.isArray(data.headerSliderImages)
          ? [...data.headerSliderImages, ...Array(3).fill("")].slice(0, 3)
          : Array(3).fill("");

        setConfig({
          galleryImages: gallery,
          consultImage: data.consultImage || "",
          headerSliderImages: headerSlider,
          heroBackgroundImage: data.heroBackgroundImage || "",
          updatedAt: data.updatedAt || null,
        });
        setHistory(normalizeHistory(data.imageHistory));
      }
    } catch (error) {
      console.error(error);
      alert("Không tải được cấu hình ảnh trang chủ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleGalleryFile = (index, file) => {
    setFiles((prev) => {
      const next = [...prev.gallery];
      next[index] = file || null;
      return { ...prev, gallery: next };
    });

    setPreviews((prev) => {
      const next = [...prev.gallery];
      next[index] = file ? URL.createObjectURL(file) : "";
      return { ...prev, gallery: next };
    });

    setPathOverrides((prev) => {
      const next = [...prev.gallery];
      next[index] = "";
      return { ...prev, gallery: next };
    });
  };

  const handleConsultFile = (file) => {
    setFiles((prev) => ({ ...prev, consult: file || null }));
    setPreviews((prev) => ({
      ...prev,
      consult: file ? URL.createObjectURL(file) : "",
    }));
    setPathOverrides((prev) => ({ ...prev, consult: "" }));
  };

  const handleHeaderSliderFile = (index, file) => {
    setFiles((prev) => {
      const next = [...prev.headerSlider];
      next[index] = file || null;
      return { ...prev, headerSlider: next };
    });

    setPreviews((prev) => {
      const next = [...prev.headerSlider];
      next[index] = file ? URL.createObjectURL(file) : "";
      return { ...prev, headerSlider: next };
    });

    setPathOverrides((prev) => {
      const next = [...prev.headerSlider];
      next[index] = "";
      return { ...prev, headerSlider: next };
    });
  };

  const handleHeroBackgroundFile = (file) => {
    setFiles((prev) => ({ ...prev, heroBackground: file || null }));
    setPreviews((prev) => ({
      ...prev,
      heroBackground: file ? URL.createObjectURL(file) : "",
    }));
    setPathOverrides((prev) => ({ ...prev, heroBackground: "" }));
  };

  const handleRestoreGallery = (index, imagePath) => {
    setFiles((prev) => {
      const next = [...prev.gallery];
      next[index] = null;
      return { ...prev, gallery: next };
    });
    setPreviews((prev) => {
      const next = [...prev.gallery];
      next[index] = toImageUrl(imagePath);
      return { ...prev, gallery: next };
    });
    setPathOverrides((prev) => {
      const next = [...prev.gallery];
      next[index] = imagePath;
      return { ...prev, gallery: next };
    });
  };

  const handleRestoreHeader = (index, imagePath) => {
    setFiles((prev) => {
      const next = [...prev.headerSlider];
      next[index] = null;
      return { ...prev, headerSlider: next };
    });
    setPreviews((prev) => {
      const next = [...prev.headerSlider];
      next[index] = toImageUrl(imagePath);
      return { ...prev, headerSlider: next };
    });
    setPathOverrides((prev) => {
      const next = [...prev.headerSlider];
      next[index] = imagePath;
      return { ...prev, headerSlider: next };
    });
  };

  const handleRestoreConsult = (imagePath) => {
    setFiles((prev) => ({ ...prev, consult: null }));
    setPreviews((prev) => ({ ...prev, consult: toImageUrl(imagePath) }));
    setPathOverrides((prev) => ({ ...prev, consult: imagePath }));
  };

  const handleRestoreHeroBackground = (imagePath) => {
    setFiles((prev) => ({ ...prev, heroBackground: null }));
    setPreviews((prev) => ({ ...prev, heroBackground: toImageUrl(imagePath) }));
    setPathOverrides((prev) => ({ ...prev, heroBackground: imagePath }));
  };

  const handleSave = async () => {
    const hasFile =
      files.gallery.some(Boolean) ||
      Boolean(files.consult) ||
      files.headerSlider.some(Boolean) ||
      Boolean(files.heroBackground);
    const hasPathOverride =
      pathOverrides.gallery.some(Boolean) ||
      Boolean(pathOverrides.consult) ||
      pathOverrides.headerSlider.some(Boolean) ||
      Boolean(pathOverrides.heroBackground);

    if (!hasFile && !hasPathOverride) {
      alert("Bạn chưa chọn ảnh nào để cập nhật");
      return;
    }

    const formData = new FormData();
    formData.append("action", "saveHomepageImages");

    files.gallery.forEach((file, index) => {
      if (file) {
        formData.append(`gallery_${index + 1}`, file);
      }
    });
    pathOverrides.gallery.forEach((path, index) => {
      if (path) {
        formData.append(`gallery_path_${index + 1}`, path);
      }
    });

    if (files.consult) {
      formData.append("consult_image", files.consult);
    }
    if (pathOverrides.consult) {
      formData.append("consult_path", pathOverrides.consult);
    }

    files.headerSlider.forEach((file, index) => {
      if (file) {
        formData.append(`header_${index + 1}`, file);
      }
    });
    pathOverrides.headerSlider.forEach((path, index) => {
      if (path) {
        formData.append(`header_path_${index + 1}`, path);
      }
    });

    if (files.heroBackground) {
      formData.append("hero_background", files.heroBackground);
    }
    if (pathOverrides.heroBackground) {
      formData.append("hero_background_path", pathOverrides.heroBackground);
    }

    setSaving(true);
    try {
      const res = await axios.post(API, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        alert("Cập nhật ảnh trang chủ thành công");
        setFiles({
          gallery: Array(7).fill(null),
          consult: null,
          headerSlider: Array(3).fill(null),
          heroBackground: null,
        });
        setPreviews({
          gallery: Array(7).fill(""),
          consult: "",
          headerSlider: Array(3).fill(""),
          heroBackground: "",
        });
        setPathOverrides({
          gallery: Array(7).fill(""),
          consult: "",
          headerSlider: Array(3).fill(""),
          heroBackground: "",
        });
        loadConfig();
      } else {
        alert(res.data?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi cập nhật ảnh trang chủ");
    } finally {
      setSaving(false);
    }
  };

  const formattedUpdatedAt = useMemo(() => {
    if (!config.updatedAt) return "Chưa có lần cập nhật";
    try {
      return new Date(config.updatedAt).toLocaleString("vi-VN");
    } catch {
      return config.updatedAt;
    }
  }, [config.updatedAt]);

  const logout = () => {
    clearAuthSession();
    navigate("/");
  };

  return (
    <div className="home-image-admin-layout">
      <aside className="sidebar">
        <div className="logo">NGỌC THIỆN ADMIN</div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">
            <FaHome /> Tổng quan
          </NavLink>

          {role === "admin" && (
            <NavLink to="/qlnguoidung">
              <FaUsers /> Người dùng
            </NavLink>
          )}

          <NavLink to="/qlsanpham">
            <FaBox /> Dịch vụ
          </NavLink>

          <NavLink to="/qlhinhanh" className="active">
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

          <NavLink to="/lichlamviec">
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
        <header className="content-header">
          <h2>Quản lý ảnh trang chủ</h2>
        </header>

        <div className="status-box">
          <span>Trạng thái: {loading ? "Đang tải..." : "Sẵn sàng"}</span>
          <span>Lần cập nhật gần nhất: {formattedUpdatedAt}</span>
        </div>

        <section className="card">
          <h3>Ảnh khu vực Ngọc Thiện Wedding (Hero) - Phần trên cùng</h3>
          <div className="image-grid hero-grid">
            {Array.from({ length: 3 }).map((_, index) => {
              const current = config.headerSliderImages[index];
              const preview = previews.headerSlider[index];
              const display = preview || toImageUrl(current) || defaultHeaderSliderImages[index];

              return (
                <div key={index} className="image-item">
                  <div className="image-preview">
                    {display ? (
                      <img src={display} alt={`Hero slider ${index + 1}`} />
                    ) : (
                      <div className="empty">Chưa có ảnh</div>
                    )}
                  </div>

                  <label className="upload-label" htmlFor={`hero-slider-${index}`}>
                    <FaUpload /> Chọn ảnh {index + 1}
                  </label>
                  <input
                    id={`hero-slider-${index}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleHeaderSliderFile(index, e.target.files?.[0])}
                  />

                  {history.headerSlider[index]?.length > 0 && (
                    <div className="history-box">
                      <div className="history-title">Ảnh đã thay</div>
                      <div className="history-list">
                        {history.headerSlider[index].map((imgPath, historyIndex) => (
                          <button
                            key={`${index}-${historyIndex}-${imgPath}`}
                            type="button"
                            className="history-thumb"
                            title="Nhấn để dùng lại ảnh này"
                            onClick={() => handleRestoreHeader(index, imgPath)}
                          >
                            <img src={toImageUrl(imgPath)} alt={`Lịch sử slider ${historyIndex + 1}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="consult-row hero-bg-row">
            <div className="consult-preview">
              {(previews.heroBackground || toImageUrl(config.heroBackgroundImage) || heroBgDefault) ? (
                <img
                  src={previews.heroBackground || toImageUrl(config.heroBackgroundImage) || heroBgDefault}
                  alt="Hero background"
                />
              ) : (
                <div className="empty">Chưa có ảnh nền hero</div>
              )}
            </div>

            <div className="consult-actions">
              <label className="upload-label" htmlFor="hero-background">
                <FaUpload /> Chọn ảnh nền Ngọc Thiện Wedding
              </label>
              <input
                id="hero-background"
                type="file"
                accept="image/*"
                onChange={(e) => handleHeroBackgroundFile(e.target.files?.[0])}
              />

              {history.heroBackground.length > 0 && (
                <div className="history-box">
                  <div className="history-title">Ảnh đã thay</div>
                  <div className="history-list">
                    {history.heroBackground.map((imgPath, historyIndex) => (
                      <button
                        key={`${historyIndex}-${imgPath}`}
                        type="button"
                        className="history-thumb"
                        title="Nhấn để dùng lại ảnh này"
                        onClick={() => handleRestoreHeroBackground(imgPath)}
                      >
                        <img src={toImageUrl(imgPath)} alt={`Lịch sử nền hero ${historyIndex + 1}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="card">
          <h3>Ảnh bộ sưu tập trang chủ (7 ảnh) - Phần giữa trang</h3>
          <div className="image-grid">
            {Array.from({ length: 7 }).map((_, index) => {
              const current = config.galleryImages[index];
              const preview = previews.gallery[index];
              const display = preview || toImageUrl(current) || defaultGalleryImages[index];

              return (
                <div key={index} className="image-item">
                  <div className="image-preview">
                    {display ? (
                      <img src={display} alt={`Gallery ${index + 1}`} />
                    ) : (
                      <div className="empty">Chưa có ảnh</div>
                    )}
                  </div>

                  <label className="upload-label" htmlFor={`gallery-${index}`}>
                    <FaUpload /> Chọn ảnh {index + 1}
                  </label>
                  <input
                    id={`gallery-${index}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleGalleryFile(index, e.target.files?.[0])}
                  />

                  {history.gallery[index]?.length > 0 && (
                    <div className="history-box">
                      <div className="history-title">Ảnh đã thay</div>
                      <div className="history-list">
                        {history.gallery[index].map((imgPath, historyIndex) => (
                          <button
                            key={`${index}-${historyIndex}-${imgPath}`}
                            type="button"
                            className="history-thumb"
                            title="Nhấn để dùng lại ảnh này"
                            onClick={() => handleRestoreGallery(index, imgPath)}
                          >
                            <img src={toImageUrl(imgPath)} alt={`Lịch sử gallery ${historyIndex + 1}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="card">
          <h3>Ảnh khung tư vấn</h3>
          <div className="consult-row">
            <div className="consult-preview">
              {(previews.consult || toImageUrl(config.consultImage) || nennb2) ? (
                <img
                  src={previews.consult || toImageUrl(config.consultImage) || nennb2}
                  alt="Consult"
                />
              ) : (
                <div className="empty">Chưa có ảnh</div>
              )}
            </div>

            <div className="consult-actions">
              <label className="upload-label" htmlFor="consult-image">
                <FaUpload /> Chọn ảnh tư vấn
              </label>
              <input
                id="consult-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleConsultFile(e.target.files?.[0])}
              />

              {history.consult.length > 0 && (
                <div className="history-box">
                  <div className="history-title">Ảnh đã thay</div>
                  <div className="history-list">
                    {history.consult.map((imgPath, historyIndex) => (
                      <button
                        key={`${historyIndex}-${imgPath}`}
                        type="button"
                        className="history-thumb"
                        title="Nhấn để dùng lại ảnh này"
                        onClick={() => handleRestoreConsult(imgPath)}
                      >
                        <img src={toImageUrl(imgPath)} alt={`Lịch sử tư vấn ${historyIndex + 1}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="footer-actions">
          <button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default HomeImageManagement;

