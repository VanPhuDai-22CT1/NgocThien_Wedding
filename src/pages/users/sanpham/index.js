import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { getAuthItem } from "utils/authStorage";
import { addGuestCartItem } from "utils/guestCart";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import "./style.scss";
import { getImageUrl } from "../../../utils/image";

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const includesOneOf = (text, keywords) =>
  keywords.some((keyword) => text.includes(keyword));

const matchesCategoryByName = (categoryName, product) => {
  const text = normalizeText(`${product.name || ""} ${product.description || ""}`);
  const productCategoryId = Number(product.category_id || 0);

  switch (categoryName) {
    case "Thực Đơn Bàn Tiệc":
    case "Thực đơn":
    case "Thực Đơn":
      if (productCategoryId === 3) return true;
      return includesOneOf(text, ["thuc don", "ban tiec", "menu"]);

    case "Trang Trí Gia Tiên":
      return text.includes("gia tien");

    case "Mâm Quả Kết Rồng Phượng": {
      const hasMamOrTrap = includesOneOf(text, ["mam", "trap", "mam qua"]);
      const hasRongPhung = includesOneOf(text, ["rong", "phung", "rong phung"]);
      return hasMamOrTrap && hasRongPhung;
    }

    case "Cho Thuê Khung Rạp":
      return includesOneOf(text, ["khung rap", "rap cuoi", "trai cuoi", "nha rap"]);

    case "Dịch Vụ Bê Tráp":
      return includesOneOf(text, ["be trap", "doi be trap"]);

    case "Trọn Gói Ngày Cưới":
      return includesOneOf(text, ["tron goi", "ngay cuoi", "cuoi hoi"]);

    default:
      return false;
  }
};

const ProductCard = ({ product, onAddToCart }) => {
  const averageRating = Number(product.average_rating || 0);
  const reviewCount = Number(product.review_count || 0);
  const roundedStars = Math.max(0, Math.min(5, Math.round(averageRating)));
  const starsText = "★".repeat(roundedStars) + "☆".repeat(5 - roundedStars);

  return (
    <div className="product-card">
      <div className="product-image">
        <img
          src={getImageUrl(product.cover)}
          alt={product.name}
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/400x400?text=No+Image";
          }}
        />

        <div className="image-actions">
          {/* 👁 CHUYỂN TRANG CHI TIẾT */}
          <Link
            to={`/chitietsanpham/${product.id}`}
            className="circle-btn"
          >
            <FaEye />
          </Link>

          {/* 🛒 GIỎ HÀNG */}
          <button
            type="button"
            className="circle-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id, 1);
            }}
          >
            <FiShoppingCart />
          </button>
        </div>
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{Number(product.price).toLocaleString()} VND</p>

        <div className="product-rating-real">
          {reviewCount > 0 ? (
            <>
              <span className="stars" aria-label={`${averageRating.toFixed(1)} trên 5 sao`}>
                {starsText}
              </span>
              <span className="meta">
                <span className="score">{averageRating.toFixed(1)}/5</span>
                <span className="dot">•</span>
                <span className="count">{reviewCount} đánh giá</span>
              </span>
            </>
          ) : (
            <span className="no-review">Chưa có đánh giá</span>
          )}
        </div>

      </div>
    </div>
  );
};

const ProductList = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const searchKeyword = queryParams.get("search") || "";
  const categoryParam = queryParams.get("category") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const addToCart = async (productId, quantity) => {
    const userId = getAuthItem("user_id");
    const selectedProduct = products.find(
      (item) => Number(item.id) === Number(productId)
    );

    if (!userId) {
      addGuestCartItem(
        {
          productId: Number(productId),
          name: selectedProduct?.name,
          price: Number(selectedProduct?.price || 0),
          cover: selectedProduct?.cover || "",
        },
        Number(quantity || 1)
      );
      alert("Đã thêm vào giỏ hàng ✅");
      return;
    }

    try {
      const res = await apiClient.post(
        "/cart",
        {
          userid: Number(userId),
          productId,
          quantity,
        },
        { headers: buildAuthHeaders() }
      );

      if (res.data.success) {
        alert("Đã thêm vào giỏ hàng ✅");
      } else {
        alert(res.data.message || "Thêm thất bại ❌");
      }
    } catch (err) {
      console.error("Add to cart error:", err);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get("/products");
        setProducts(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi load sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchSearch = searchKeyword
      ? product.name?.toLowerCase().includes(searchKeyword.toLowerCase())
      : true;

    const matchCategory = (() => {
      if (!categoryParam) return true;

      const paramNormalized = normalizeText(categoryParam);

      // Support old behavior when category is sent as numeric id.
      if (/^\d+$/.test(categoryParam)) {
        return String(product.category_id) === String(categoryParam);
      }

      const productCategoryCandidates = [
        product.category_name,
        product.category,
        product.category_title,
      ]
        .map(normalizeText)
        .filter(Boolean);

      if (productCategoryCandidates.some((name) => name.includes(paramNormalized))) {
        return true;
      }

      return matchesCategoryByName(categoryParam, product);
    })();

    return matchSearch && matchCategory;
  });

  if (loading) return <p className="loading">Đang tải sản phẩm...</p>;

  return (
    <section className="product-list">
      <h2 className="product-title">
        {searchKeyword
          ? `Kết quả tìm kiếm: "${searchKeyword}"`
          : categoryParam
          ? `Danh mục: ${categoryParam}`
          : "Sản phẩm nổi bật"}
      </h2>

      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              onAddToCart={addToCart}
            />
          ))
        ) : (
          <p>Không tìm thấy sản phẩm phù hợp ❌</p>
        )}
      </div>
    </section>
  );
};

export default ProductList;