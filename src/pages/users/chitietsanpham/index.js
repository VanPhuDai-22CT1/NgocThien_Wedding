import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaRegStar, FaStar } from "react-icons/fa";
import { getAuthItem } from "utils/authStorage";
import { addGuestCartItem } from "utils/guestCart";
import { getImageUrl } from "utils/image";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import "./style.scss";

const renderStarIcons = (rating, interactive = false, onSelect) =>
  Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const filled = starValue <= rating;
    const Icon = filled ? FaStar : FaRegStar;

    if (!interactive) {
      return <Icon key={starValue} className={`star ${filled ? "filled" : ""}`} />;
    }

    return (
      <button
        type="button"
        key={starValue}
        className={`star-button ${filled ? "filled" : ""}`}
        onClick={() => onSelect(starValue)}
      >
        <Icon />
      </button>
    );
  });

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  const fallbackImage = "https://via.placeholder.com/1000x700?text=No+Image";

  /* ================= LOAD PRODUCT ================= */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productResponse, reviewResponse] = await Promise.all([
          apiClient.get(`/products/${id}`),
          apiClient.get(`/reviews/product/${id}`),
        ]);

        const selected = productResponse.data?.data || null;

        if (selected) {
          setProduct(selected);
          const imageList = selected.image_urls || selected.images || [];
          setMainImage(imageList?.[0] || selected.cover || "");
        } else {
          setProduct(null);
        }

        setReviews(reviewResponse.data?.data || []);
      } catch (error) {
        console.error("Lỗi API:", error);
        setProduct(null);
        setReviews([]);
      } finally {
        setLoading(false);
        setReviewLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const loadReviews = async () => {
    try {
      setReviewLoading(true);
      const response = await apiClient.get(`/reviews/product/${id}`);
      const nextReviews = response.data?.data || [];
      const nextSummary = response.data?.summary || {};

      setReviews(nextReviews);
      setProduct((prev) => prev ? ({
        ...prev,
        average_rating: Number(nextSummary.average_rating || 0),
        review_count: Number(nextSummary.review_count || nextReviews.length || 0),
      }) : prev);
    } catch (error) {
      console.error("Lỗi tải đánh giá:", error);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (!product) return <div className="loading">Không tìm thấy sản phẩm.</div>;

  const averageRating = Number(product.average_rating || 0);
  const reviewCount = Number(product.review_count || reviews.length || 0);
  const descriptionLines = String(product.description || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const serviceLines = String(product.service_details || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const productImages = product.image_urls || product.images || [];

  const submitReview = async () => {
    const storedUserId = getAuthItem("user_id");
    const username = getAuthItem("username") || "";

    if (!storedUserId) {
      alert("Vui lòng đăng nhập để gửi đánh giá!");
      navigate("/login");
      return;
    }

    if (!reviewForm.comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await apiClient.post(
        "/reviews",
        {
          productId: Number(product.id),
          user_id: Number(storedUserId),
          reviewer_name: username,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data?.success) {
        setReviewForm({ rating: 5, comment: "" });
        await loadReviews();
        alert("Cảm ơn bạn đã gửi đánh giá!");
      } else {
        alert(response.data?.message || "Gửi đánh giá thất bại!");
      }
    } catch (error) {
      console.error("Lỗi gửi đánh giá:", error);
      alert("Có lỗi xảy ra khi gửi đánh giá!");
    } finally {
      setSubmittingReview(false);
    }
  };

  /* ================= SỐ LƯỢNG ================= */
  const increaseQty = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  /* ================= GIỎ HÀNG ================= */
  const addToCart = async () => {
    const storedUserId = getAuthItem("user_id");

    if (!storedUserId) {
      addGuestCartItem(
        {
          productId: Number(product.id),
          name: product.name,
          price: Number(product.price || 0),
          cover: product.cover || "",
        },
        Number(quantity || 1)
      );
      alert("Đã thêm vào giỏ hàng!");
      return;
    }

    try {
      const res = await apiClient.post(
        "/cart",
        {
          userid: Number(storedUserId),
          productId: Number(product.id),
          quantity: Number(quantity),
        },
        { headers: buildAuthHeaders() }
      );

      if (res.data?.success) {
        alert("Đã thêm vào giỏ hàng!");
      } else {
        alert(res.data?.message || "Thêm thất bại!");
      }
    } catch (error) {
      console.error("Lỗi thêm giỏ hàng:", error);
      alert("Có lỗi xảy ra!");
    }
  };

  const buyNow = async () => {
    await addToCart();
    navigate("/giohang");
  };

  const openImagePreview = (imageName) => {
    if (!imageName) return;
    setMainImage(imageName);
    setShowPreview(true);
  };

  return (
  <div className="product-detail">
    <div className="detail-container">
      {/* ================= IMAGE SECTION ================= */}
      <div className="image-section">
        <div className="main-image-wrapper">
          <img
            src={getImageUrl(mainImage)}
            alt={product.name}
            className="main-image"
            onClick={() => setShowPreview(true)}
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />

          <div
            className={`favorite ${favorite ? "active" : ""}`}
            onClick={() => setFavorite(!favorite)}
          >
            ❤️
          </div>
        </div>

        <div className="thumbnail-list">
          {productImages?.map((img, index) => (
            <img
              key={index}
              src={getImageUrl(img)}
              alt="thumbnail"
              className={`thumbnail ${mainImage === img ? "active" : ""}`}
              onClick={() => openImagePreview(img)}
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
            />
          ))}
        </div>
      </div>

      {/* ================= INFO SECTION ================= */}
      <div className="info-section">
        <h2>{product.name}</h2>

        <div className="rating-summary">
          <div className="rating-stars">
            {renderStarIcons(Math.round(averageRating))}
          </div>
          <div className="rating-summary-text">
            <strong>{averageRating > 0 ? averageRating.toFixed(1) : "5.0"}</strong>
            <span>{reviewCount} đánh giá từ khách hàng</span>
          </div>
        </div>

        <div className="price">
          {Number(product.price).toLocaleString()} VNĐ
        </div>

        <div className="actions">
          <button className="add-cart" onClick={addToCart}>
            🛒 Thêm vào giỏ
          </button>

          <button className="buy-now" onClick={buyNow}>
            ⚡ Mua ngay
          </button>
        </div>
      </div>
    </div>

    {/* ================= DESCRIPTION SECTION ================= */}
    <div className="description-section">
      <h3>📌 Mô tả dịch vụ</h3>
      <div className="description-content">
        {(descriptionLines.length ? descriptionLines : ["Dịch vụ đang được cập nhật mô tả chi tiết."]).map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>

      <h3>🎁 Dịch vụ bao gồm</h3>
      <ul className="service-list">
        {serviceLines.length
          ? serviceLines.map((item, index) => (
              <li key={index}>{item}</li>
            ))
          : (
            <>
              <li>Trang trí không gian theo concept</li>
              <li>Hệ thống âm thanh – ánh sáng</li>
              <li>MC dẫn chương trình</li>
              <li>Đội ngũ phục vụ chuyên nghiệp</li>
            </>
          )}
      </ul>

      <h3>🖼 Hình ảnh dịch vụ</h3>
      <div className="extra-images">
        {productImages?.map((img, index) => (
          <img
            key={index}
            src={getImageUrl(img)}
            alt="extra"
            onClick={() => openImagePreview(img)}
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
        ))}
      </div>

      <div className="reviews-section">
        <div className="reviews-header">
          <div>
            <h3>⭐ Khách hàng đánh giá</h3>
            <p>Những chia sẻ thật từ khách hàng đã sử dụng dịch vụ của Ngọc Thiện Wedding.</p>
          </div>
          <div className="reviews-overview">
            <strong>{averageRating > 0 ? averageRating.toFixed(1) : "5.0"}</strong>
            <span>{reviewCount} lượt đánh giá</span>
          </div>
        </div>

        <div className="review-form">
          <div className="review-form__stars">
            <span>Chọn số sao của bạn</span>
            <div className="interactive-stars">
              {renderStarIcons(reviewForm.rating, true, (value) =>
                setReviewForm((prev) => ({ ...prev, rating: value }))
              )}
            </div>
          </div>

          <textarea
            placeholder="Hãy chia sẻ cảm nhận của bạn về dịch vụ này..."
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
            rows={4}
          />

          <button className="submit-review" onClick={submitReview} disabled={submittingReview}>
            {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>

        {reviewLoading ? (
          <div className="reviews-empty">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận của bạn.</div>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <div className="review-card" key={review.id}>
                <div className="review-card__top">
                  <div>
                    <strong>{review.reviewer_name}</strong>
                    <div className="review-card__stars">
                      {renderStarIcons(Number(review.rating || 0))}
                    </div>
                  </div>
                  <span>
                    {new Date(review.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p>{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* ================= IMAGE MODAL ================= */}
    {showPreview && (
      <div
        className="image-modal"
        onClick={() => setShowPreview(false)}
      >
        <img
          src={getImageUrl(mainImage)}
          alt="Preview"
          className="modal-image"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />
      </div>
    )}
  </div>
);
};

export default ProductDetail;