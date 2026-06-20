import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { getAuthItem } from "utils/authStorage";
import { addGuestCartItem } from "utils/guestCart";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import { getImageUrl, getProductImage } from "../../../utils/image";
import "./style.scss";

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .trim();

const includesOneOf = (text, keywords) =>
  keywords.some((keyword) => text.includes(keyword));

const categoryMatchers = {
  "thuc don": {
    ids: [3],
    keywords: ["thuc don", "ban tiec", "menu", "nau tiec", "nau an", "mon an"],
  },
  "thuc don tiec cuoi": {
    ids: [3],
    keywords: ["thuc don", "ban tiec", "menu", "nau tiec", "nau an", "mon an"],
  },
  "trang tri gia tien": {
    ids: [1],
    keywords: ["trang tri", "gia tien", "san khau", "backdrop", "cong hoa"],
  },
  "trang tri tiec cuoi": {
    ids: [5],
    keywords: ["trang tri", "tiec cuoi", "san khau", "backdrop", "cong hoa", "ban gallery"],
  },
  "chup anh cuoi": {
    ids: [2],
    keywords: ["chup anh", "anh cuoi", "album", "studio", "phong su anh"],
  },
  "quay phim cuoi": {
    ids: [6],
    keywords: ["quay phim", "video", "phong su cuoi", "clip cuoi", "highlight"],
  },
  "mam qua cuoi hoi": {
    ids: [7],
    keywords: ["mam qua", "trap", "rong phung", "le vat", "an hoi"],
  },
  "mam qua ket rong phuong": {
    ids: [7],
    keywords: ["mam qua", "trap", "rong phung", "le vat", "an hoi"],
  },
  "cho thue khung rap": {
    ids: [9],
    keywords: ["khung rap", "rap cuoi", "trai cuoi", "nha rap", "ban ghe"],
  },
  "dich vu be trap": {
    ids: [8],
    keywords: ["be trap", "doi be trap", "bung qua", "le tan"],
  },
  "am thanh anh sang": {
    ids: [10],
    keywords: ["am thanh", "anh sang", "loa", "micro", "den", "led"],
  },
  "trang phuc cuoi": {
    ids: [11],
    keywords: ["trang phuc", "ao cuoi", "vest", "ao dai", "makeup", "trang diem"],
  },
  "xe hoa": {
    ids: [12],
    keywords: ["xe hoa", "xe cuoi", "xe ruoc dau"],
  },
  "thiep cuoi & qua cuoi": {
    ids: [13],
    keywords: ["thiep cuoi", "qua cuoi", "qua tang", "wedding favor"],
  },
  "tron goi ngay cuoi": {
    ids: [14],
    keywords: ["tron goi", "ngay cuoi", "cuoi hoi", "combo", "goi cuoi"],
  },
};

const matchesCategoryByName = (categoryName, product) => {
  const normalizedCategory = normalizeText(categoryName);
  const matcher = categoryMatchers[normalizedCategory];
  const productCategoryId = Number(product.category_id || 0);
  const text = normalizeText(
    `${product.name || ""} ${product.description || ""} ${product.service_details || ""}`
  );

  if (!matcher) {
    return text.includes(normalizedCategory);
  }

  if (matcher.ids.includes(productCategoryId)) return true;
  return includesOneOf(text, matcher.keywords);
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
          src={getImageUrl(getProductImage(product))}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = "https://via.placeholder.com/400x400?text=No+Image";
          }}
        />

        <div className="image-actions">
          <Link to={`/chitietsanpham/${product.id}`} className="circle-btn" aria-label="Xem chi tiết">
            <FaEye />
          </Link>

          <button
            type="button"
            className="circle-btn"
            onClick={(event) => {
              event.stopPropagation();
              onAddToCart(product.id, 1);
            }}
            aria-label="Thêm vào giỏ"
          >
            <FiShoppingCart />
          </button>
        </div>
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">
          {Number(product.price || 0).toLocaleString("vi-VN")} VND
        </p>

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/products");
        setProducts(response.data?.data || []);
      } catch (error) {
        console.error("Load products error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
          cover: getProductImage(selectedProduct),
        },
        Number(quantity || 1)
      );
      alert("Đã thêm vào giỏ hàng");
      return;
    }

    try {
      const response = await apiClient.post(
        "/cart",
        {
          userid: Number(userId),
          productId,
          quantity,
        },
        { headers: buildAuthHeaders() }
      );

      if (response.data?.success) {
        alert("Đã thêm vào giỏ hàng");
      } else {
        alert(response.data?.message || "Thêm dịch vụ thất bại");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Có lỗi xảy ra khi thêm dịch vụ vào giỏ hàng");
    }
  };

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const searchableText = normalizeText(
          `${product.name || ""} ${product.description || ""} ${product.service_details || ""}`
        );
        const matchSearch = searchKeyword
          ? searchableText.includes(normalizeText(searchKeyword))
          : true;

        const matchCategory = (() => {
          if (!categoryParam) return true;

          if (/^\d+$/.test(categoryParam)) {
            return String(product.category_id) === String(categoryParam);
          }

          const normalizedCategory = normalizeText(categoryParam);
          const productCategoryCandidates = [
            product.category_name,
            product.category,
            product.category_title,
          ]
            .map(normalizeText)
            .filter(Boolean);

          if (
            productCategoryCandidates.some((name) =>
              name.includes(normalizedCategory)
            )
          ) {
            return true;
          }

          return matchesCategoryByName(categoryParam, product);
        })();

        return matchSearch && matchCategory;
      }),
    [categoryParam, products, searchKeyword]
  );

  if (loading) {
    return <p className="loading">Đang tải dịch vụ...</p>;
  }

  return (
    <section className="product-list">
      <h2 className="product-title">
        {searchKeyword
          ? `Kết quả tìm kiếm: "${searchKeyword}"`
          : categoryParam
          ? `Danh mục: ${categoryParam}`
          : "Dịch vụ nổi bật"}
      </h2>

      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item) => (
            <ProductCard key={item.id} product={item} onAddToCart={addToCart} />
          ))
        ) : (
          <p>Không tìm thấy dịch vụ phù hợp</p>
        )}
      </div>
    </section>
  );
};

export default ProductList;
