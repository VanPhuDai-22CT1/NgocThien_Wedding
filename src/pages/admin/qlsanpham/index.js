import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import { getImageUrl } from "../../../utils/image";
import { clearAuthSession, getAuthItem } from "utils/authStorage";
import { 
  FaBox, FaUsers, FaShoppingCart, FaBell, FaHistory, 
  FaChartPie, FaSearch, FaPlus, FaTimes, FaStar, FaRegStar,
  FaComments,
  FaSignOutAlt, FaEdit, FaTrash, FaArrowLeft, FaImage, FaRegCalendarAlt
} from "react-icons/fa";
import "./style.scss";

const API = "http://localhost:4000/api/legacy";

export default function QLSanPham() {
  const navigate = useNavigate();

  const role = getAuthItem("role");

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [imageSlots, setImageSlots] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingFeaturedId, setUpdatingFeaturedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: 0,
    category_id: 1,
    is_featured: 0,
  });

  const categories = [
    { id: 1, name: "Trang trí" },
    { id: 2, name: "Chụp ảnh" },
    { id: 3, name: "Thực đơn" },
    { id: 4, name: "Khác" },
  ];

  /* ================= FETCH ================= */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, {
        params: { action: "getProducts" },
      });

      if (res.data?.success) {
        const normalized = (res.data.data || []).map((p) => ({
          ...p,
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
          category_id: Number(p.category_id) || 1,
          is_featured: Number(p.is_featured) || 0,
        }));

        setProducts(normalized);
        setFilteredProducts(normalized);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (err) {
      console.error(err);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredProducts(
        products.filter((p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  /* ================= HANDLE ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    const newSlots = files.map(file => ({
      type: 'new', file, previewUrl: URL.createObjectURL(file),
    }));
    setImageSlots(prev => [...prev, ...newSlots]);
    e.target.value = '';
  };

  const handleReplaceSlot = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageSlots(prev => prev.map((slot, i) =>
      i === index ? { type: 'new', file, previewUrl: URL.createObjectURL(file) } : slot
    ));
    e.target.value = '';
  };

  const resetForm = () => {
    setEditingId(null);
    setImageSlots([]);
    setForm({
      name: "",
      description: "",
      price: "",
      stock: 0,
      category_id: 1,
      is_featured: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Vui lòng nhập tên dịch vụ!");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "price") {
        formData.append(key, Number(value) * 1000000);
      } else if (key === "stock" || key === "category_id" || key === "is_featured") {
        formData.append(key, Number(value) || 0);
      } else {
        formData.append(key, value);
      }
    });

    const newFiles = imageSlots.filter(s => s.type === 'new').map(s => s.file);
    newFiles.forEach(file => formData.append("images[]", file));

    if (editingId) {
      formData.append("id", editingId);
      let newFileIdx = 0;
      const slotsOrder = imageSlots.map(s =>
        s.type === 'existing' ? `existing:${s.filename}` : `new:${newFileIdx++}`
      );
      formData.append('slots_order', JSON.stringify(slotsOrder));
    }

    const action = editingId ? "updateProduct" : "addProduct";

    try {
      const res = await axios.post(
        `${API}?action=${action}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data?.success) {
        alert(editingId ? "Cập nhật thành công!" : "Thêm dịch vụ thành công!");
        resetForm();
        fetchProducts();
      } else {
        alert("Thao tác thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: Number(p.price) > 0 ? Number(p.price) / 1000000 : "",
      stock: 0,
      category_id: Number(p.category_id) || 1,
      is_featured: Number(p.is_featured) || 0,
    });
    try {
      const images = JSON.parse(p.image_urls || "[]");
      setImageSlots(images.map(img => ({
        type: 'existing', filename: img, previewUrl: getImageUrl(img),
      })));
    } catch { setImageSlots([]); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa dịch vụ này?")) return;

    setLoading(true);
    try {
      const res = await axios.get(API, {
        params: { action: "deleteProduct", id },
      });

      if (res.data?.success) {
        alert("Xóa thành công!");
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (product) => {
    const nextFeatured = Number(product.is_featured) === 1 ? 0 : 1;
    setUpdatingFeaturedId(product.id);

    const formData = new FormData();
    formData.append("id", product.id);
    formData.append("name", product.name || "");
    formData.append("description", product.description || "");
    formData.append("price", Number(product.price) || 0);
    formData.append("stock", Number(product.stock) || 0);
    formData.append("category_id", Number(product.category_id) || 1);
    formData.append("is_featured", nextFeatured);

    try {
      const res = await axios.post(`${API}?action=updateProduct`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === product.id
              ? { ...item, is_featured: nextFeatured }
              : item
          )
        );
        setFilteredProducts((prev) =>
          prev.map((item) =>
            item.id === product.id
              ? { ...item, is_featured: nextFeatured }
              : item
          )
        );
      } else {
        alert(res.data?.message || "Không cập nhật được sản phẩm nổi bật");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi cập nhật nổi bật");
    } finally {
      setUpdatingFeaturedId(null);
    }
  };

  const logout = () => {
    clearAuthSession();
    navigate("/");
  };

  /* ================= RENDER ================= */
  return (
    <>
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <h1 style={{ color: '#ffffff' }}>NGỌC THIỆN</h1>
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

          <NavLink to="/qlsanpham" className="active">
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

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="admin-content">
        {/* HEADER */}
        <div className="admin-header">
          <div>
            <h2><FaBox /> Quản lý dịch vụ</h2>
            <p className="subtitle">Quản lý các dịch vụ và sản phẩm cưới hỏi</p>
          </div>
          <button className="btn-back" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft /> Quay lại
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="search-bar">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery("")}>
                <FaTimes />
              </button>
            )}
          </div>
          <div className="stats">
            <strong>{filteredProducts.length}</strong> dịch vụ
          </div>
        </div>

        {/* FORM */}
        <div className="card form-card">
          <div className="card-header">
            <h3>
              <FaPlus /> {editingId ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
            </h3>
            {editingId && (
              <button className="btn-cancel" onClick={resetForm}>
                <FaTimes /> Hủy
              </button>
            )}
          </div>

          <form className="product-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                  <label>Tên dịch vụ *</label>
                  <input
                    name="name"
                    placeholder="Nhập tên dịch vụ"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
              </div>

              <div className="form-group">
                <label>Danh mục</label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                  <label>Giá (triệu VNĐ) *</label>
                <input
                  type="number"
                  name="price"
                  placeholder="VD: 45"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div className="form-group full">
                <label>Mô tả chi tiết</label>
                <textarea
                  name="description"
                  placeholder="Nhập mô tả chi tiết về dịch vụ"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                />
            </div>

            <div className="form-group full">
              <div className="featured-label">
                <input
                  type="checkbox"
                  checked={form.is_featured === 1}
                  onChange={(e) =>
                    setForm({ ...form, is_featured: e.target.checked ? 1 : 0 })
                  }
                />
                <span className="star-icon">
                  {form.is_featured === 1 ? <FaStar /> : <FaRegStar />}
                </span>
                  <span>Đánh dấu là dịch vụ nổi bật</span>
              </div>
            </div>

            <div className="form-group full">
              <label>Hình ảnh dịch vụ</label>
              <input
                type="file"
                id="file-input"
                multiple
                accept="image/*"
                onChange={handleAddImages}
                style={{ display: "none" }}
              />
              <label htmlFor="file-input" className="file-label">
                <FaPlus /> Thêm hình ảnh
              </label>

              {imageSlots.length > 0 && (
                <div className="preview-grid">
                  {imageSlots.map((slot, index) => (
                    <div key={index} className="preview-item">
                      <img
                          src={slot.previewUrl}
                          alt={`Ảnh ${index + 1}`}
                          onClick={() => setPreviewImage(slot.previewUrl)}
                        />
                      <input
                        type="file"
                        id={`replace-input-${index}`}
                        accept="image/*"
                        onChange={(e) => handleReplaceSlot(index, e)}
                        style={{ display: "none" }}
                      />
                      <label
                        htmlFor={`replace-input-${index}`}
                        className="replace-btn"
                        title="Thay ảnh này"
                      >
                        <FaImage />
                      </label>
                      <button
                        type="button"
                        className="remove-btn"
                        title="Xóa ảnh"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <FaPlus /> {editingId ? "Cập nhật" : "Thêm mới"}
                  </>
                )}
              </button>
              {editingId && (
                <button type="button" className="btn-reset" onClick={resetForm}>
                  <FaTimes /> Hủy bỏ
                </button>
              )}
            </div>
          </form>
        </div>

        {/* TABLE */}
        <div className="card">
          <div className="card-header">
            <h3>Danh sách dịch vụ</h3>
          </div>

          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Đang tải...</p>
            </div>
          )}

          {!loading && filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Chưa có dịch vụ nào</h3>
              <p>
                {searchQuery
                  ? "Không tìm thấy dịch vụ phù hợp"
                  : "Bắt đầu thêm dịch vụ đầu tiên của bạn"}
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hình ảnh</th>
                    <th>Tên dịch vụ</th>
                    <th>Danh mục</th>
                    <th>Giá</th>
                    <th>Nổi bật</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((p) => {
                    let images = [];
                    try {
                      images = JSON.parse(p.image_urls || "[]");
                    } catch {}

                    const category = categories.find((c) => c.id === p.category_id);

                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="id-badge">#{p.id}</span>
                        </td>
                        <td>
                          <div className="product-image">
                            {images.length > 0 ? (
                              <>
                                <img
                                  src={getImageUrl(images[0])}
                                  alt={p.name}
                                />
                                {images.length > 1 && (
                                  <span className="image-count">+{images.length - 1}</span>
                                )}
                              </>
                            ) : (
                              <div className="no-image">📷</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="product-info">
                            <div className="name">{p.name}</div>
                            {p.description && (
                              <div className="desc">
                                {p.description.substring(0, 50)}
                                {p.description.length > 50 && "..."}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="category-badge">
                            {category?.name || "Khác"}
                          </span>
                        </td>
                        <td className="price-col">
                          <strong>{(Number(p.price) / 1000000).toFixed(1)}</strong>
                          <span>triệu</span>
                        </td>
                        <td className="center">
                          <button
                            type="button"
                            className={`star-toggle ${Number(p.is_featured) === 1 ? "featured" : ""}`}
                            onClick={() => handleToggleFeatured(p)}
                            title={Number(p.is_featured) === 1 ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                            disabled={updatingFeaturedId === p.id}
                          >
                            {Number(p.is_featured) === 1 ? (
                              <FaStar className="star active" />
                            ) : (
                              <FaRegStar className="star" />
                            )}
                          </button>
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              className="btn-edit"
                              onClick={() => handleEdit(p)}
                              title="Chỉnh sửa"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(p.id)}
                              title="Xóa"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* LIGHTBOX */}
    {previewImage && (
      <div className="img-lightbox-overlay" onClick={() => setPreviewImage(null)}>
        <div className="img-lightbox-inner" onClick={e => e.stopPropagation()}>
          <button className="lightbox-close" onClick={() => setPreviewImage(null)}>
            <FaTimes />
          </button>
          <img src={previewImage} alt="Xem ảnh" />
        </div>
      </div>
    )}
    </>
  );
}
