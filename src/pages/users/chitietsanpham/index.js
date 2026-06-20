import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaRegStar, FaStar } from "react-icons/fa";
import { getAuthItem } from "utils/authStorage";
import { addGuestCartItem } from "utils/guestCart";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import { getImageUrl, getProductImage, parseImageList } from "utils/image";
import "./style.scss";

const fallbackImage = "https://via.placeholder.com/1000x700?text=No+Image";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;

const DESCRIPTION_HEADINGS = [
  "Mô tả chi tiết",
  "Bảng giá tham khảo theo khoảng cách",
  "Dịch vụ bao gồm",
  "Nâng cấp thêm",
  "Các dòng xe khác",
  "Điểm nổi bật",
  "Mô tả ngắn",
  "Phù hợp cho",
  "Ưu đãi",
];

const splitDescriptionItems = (text) =>
  String(text || "")
    .split(/\.\s*/)
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter(Boolean);

const getKnownSectionRows = (title, text) => {
  const normalizedTitle = String(title || "").toLowerCase();
  const source = String(text || "");

  if (normalizedTitle.includes("khoảng cách")) {
    return [
      ["Nội thành", "Dưới 20km", "2.500.000 VNĐ"],
      ["Gói tiêu chuẩn", "20 - 50km", "3.500.000 VNĐ"],
      ["Gói mở rộng", "50 - 100km", "5.000.000 VNĐ"],
      ["Gói liên huyện", "100 - 150km", "6.500.000 VNĐ"],
      ["Gói liên tỉnh", "150 - 250km", "8.500.000 VNĐ"],
      ["Trên 250km", "Báo giá riêng", "Liên hệ"],
    ].filter((row) => source.includes(row[0]));
  }

  if (normalizedTitle.includes("dòng xe")) {
    return [
      ["VinFast Lux A2.0", "2.500.000đ"],
      ["VinFast VF8", "3.500.000đ"],
      ["Kia Carnival", "4.000.000đ"],
      ["Toyota Camry", "3.000.000đ"],
      ["Mercedes C-Class", "5.500.000đ"],
      ["Mercedes E-Class", "7.000.000đ"],
      ["BMW Series 5", "7.500.000đ"],
      ["Lexus ES250", "8.000.000đ"],
      ["Mercedes S-Class", "12.000.000đ"],
      ["BMW 7 Series", "15.000.000đ"],
    ].filter((row) => source.includes(row[0]));
  }

  return [];
};

const buildDescriptionSections = (description) => {
  const raw = String(description || "").trim();
  if (!raw) return [];

  const escapedHeadings = DESCRIPTION_HEADINGS.map((heading) =>
    heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ).join("|");
  const headingRegex = new RegExp(`(${escapedHeadings})`, "g");
  const normalized = raw
    .replace(/\s+/g, " ")
    .replace(headingRegex, "\n$1\n")
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);

  const sections = [];
  let current = { title: "", content: "" };

  normalized.forEach((part) => {
    if (DESCRIPTION_HEADINGS.includes(part)) {
      if (current.title || current.content) sections.push(current);
      current = { title: part, content: "" };
      return;
    }

    current.content = current.content ? `${current.content} ${part}` : part;
  });

  if (current.title || current.content) sections.push(current);
  return sections;
};

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
        aria-label={`Chọn ${starValue} sao`}
      >
        <Icon />
      </button>
    );
  });

const isCompletedOrderStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  return [
    "delivered",
    "completed",
    "đã giao sự kiện",
    "đã bàn giao sự kiện",
    "da giao su kien",
    "da ban giao su kien",
    "đã nhận hàng",
    "da nhan hang",
  ].includes(normalized);
};

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
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewEligibility, setReviewEligibility] = useState({
    loading: true,
    canReview: false,
    message: "Đăng nhập và sử dụng dịch vụ hoàn tất để đánh giá.",
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setReviewLoading(true);
        setReviewError("");

        const response = await apiClient.get(`/products/${id}`);
        const selected = response.data?.data || null;

        if (!selected) {
          setProduct(null);
          return;
        }

        setProduct(selected);
        const images = parseImageList(selected.image_urls || selected.images);
        setMainImage(images[0] || getProductImage(selected));
      } catch (error) {
        console.error("Load product detail error:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }

      try {
        const reviewResponse = await apiClient.get(`/reviews/product/${id}`);
        setReviews(reviewResponse.data?.data || []);
      } catch (error) {
        console.error("Load product reviews error:", error);
        setReviews([]);
        setReviewError("Chưa tải được đánh giá, bạn vẫn có thể xem thông tin dịch vụ.");
      } finally {
        setReviewLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const checkReviewEligibility = async () => {
      const storedUserId = getAuthItem("user_id");
      const token = getAuthItem("token");

      if (!storedUserId || !token) {
        setReviewEligibility({
          loading: false,
          canReview: false,
          message: "Bạn cần đăng nhập và có đơn dịch vụ đã hoàn tất để đánh giá.",
        });
        return;
      }

      try {
        setReviewEligibility((prev) => ({ ...prev, loading: true }));
        const response = await apiClient.get(`/orders/user/${storedUserId}`, {
          headers: buildAuthHeaders(),
        });
        const orders = response.data?.orders || [];
        const productId = Number(id);
        const hasCompletedOrder = orders.some((order) => {
          if (!isCompletedOrderStatus(order.status)) return false;
          const items = order.OrderItems || order.details || [];
          return items.some((item) => {
            const itemProductId =
              item.product_id || item.productId || item.Product?.id || item.product?.id;
            return Number(itemProductId) === productId;
          });
        });
        const alreadyReviewed = reviews.some(
          (review) => Number(review.user_id) === Number(storedUserId)
        );

        setReviewEligibility({
          loading: false,
          canReview: hasCompletedOrder && !alreadyReviewed,
          message: alreadyReviewed
            ? "Bạn đã đánh giá dịch vụ này rồi."
            : hasCompletedOrder
            ? "Bạn có thể đánh giá dịch vụ này."
            : "Chỉ khách đã sử dụng dịch vụ và đơn đã hoàn tất mới được đánh giá.",
        });
      } catch (error) {
        console.error("Check review eligibility error:", error);
        setReviewEligibility({
          loading: false,
          canReview: false,
          message: "Chưa kiểm tra được điều kiện đánh giá. Vui lòng thử lại sau.",
        });
      }
    };

    checkReviewEligibility();
  }, [id, reviews]);

  const loadReviews = async () => {
    try {
      setReviewLoading(true);
      setReviewError("");
      const response = await apiClient.get(`/reviews/product/${id}`);
      const nextReviews = response.data?.data || [];
      const nextSummary = response.data?.summary || {};

      setReviews(nextReviews);
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              average_rating: Number(nextSummary.average_rating || 0),
              review_count: Number(nextSummary.review_count || nextReviews.length || 0),
            }
          : prev
      );
    } catch (error) {
      console.error("Load reviews error:", error);
      setReviewError("Chưa tải được đánh giá, bạn vẫn có thể xem thông tin dịch vụ.");
    } finally {
      setReviewLoading(false);
    }
  };

  const productImages = useMemo(() => {
    if (!product) return [];
    const gallery = parseImageList(product.image_urls || product.images);
    const cover = getProductImage(product);
    const images = gallery.length ? gallery : [cover];
    return [...new Set(images.filter(Boolean))];
  }, [product]);

  const descriptionSections = useMemo(
    () => buildDescriptionSections(product?.description),
    [product]
  );

  const averageRating = Number(product?.average_rating || 0);
  const reviewCount = Number(product?.review_count || reviews.length || 0);
  const hasStockLimit = Number(product?.stock || 0) > 0;

  const increaseQty = () => {
    setQuantity((prev) => {
      const next = Number(prev || 1) + 1;
      return hasStockLimit ? Math.min(next, Number(product.stock)) : next;
    });
  };

  const decreaseQty = () => {
    setQuantity((prev) => Math.max(1, Number(prev || 1) - 1));
  };

  const addToCart = async () => {
    const storedUserId = getAuthItem("user_id");
    const item = {
      productId: Number(product.id),
      name: product.name,
      price: Number(product.price || 0),
      cover: getProductImage(product),
    };

    if (!storedUserId) {
      addGuestCartItem(item, Number(quantity || 1));
      alert("Đã thêm dịch vụ vào giỏ hàng!");
      return true;
    }

    try {
      const response = await apiClient.post(
        "/cart",
        {
          userid: Number(storedUserId),
          productId: Number(product.id),
          quantity: Number(quantity),
        },
        { headers: buildAuthHeaders() }
      );

      if (response.data?.success) {
        alert("Đã thêm dịch vụ vào giỏ hàng!");
        return true;
      }

      alert(response.data?.message || "Thêm dịch vụ thất bại!");
      return false;
    } catch (error) {
      console.error("Add cart error:", error);
      alert("Có lỗi xảy ra khi thêm dịch vụ vào giỏ hàng!");
      return false;
    }
  };

  const buyNow = async () => {
    const added = await addToCart();
    if (added) navigate("/giohang");
  };

  const submitReview = async () => {
    const storedUserId = getAuthItem("user_id");
    const username = getAuthItem("username") || "Khách hàng";

    if (!storedUserId) {
      alert("Vui lòng đăng nhập để gửi đánh giá!");
      navigate("/login");
      return;
    }

    if (!reviewEligibility.canReview) {
      alert(reviewEligibility.message);
      return;
    }

    if (!reviewForm.comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await apiClient.post("/reviews", {
        productId: Number(product.id),
        reviewer_name: username,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      }, { headers: buildAuthHeaders() });

      if (response.data?.success) {
        setReviewForm({ rating: 5, comment: "" });
        await loadReviews();
        alert("Cảm ơn bạn đã gửi đánh giá!");
      } else {
        alert(response.data?.message || "Gửi đánh giá thất bại!");
      }
    } catch (error) {
      console.error("Submit review error:", error);
      alert("Có lỗi xảy ra khi gửi đánh giá!");
    } finally {
      setSubmittingReview(false);
    }
  };

  const openImagePreview = (imageName) => {
    if (!imageName) return;
    setMainImage(imageName);
    setShowPreview(true);
  };

  if (loading) {
    return <div className="loading">Đang tải dịch vụ...</div>;
  }

  if (!product) {
    return (
      <div className="product-detail">
        <div className="not-found">
          <h2>Không tìm thấy dịch vụ</h2>
          <p>Dịch vụ này có thể đã được cập nhật hoặc tạm ẩn khỏi website.</p>
          <button type="button" onClick={() => navigate("/sanpham")}>
            Quay lại danh sách dịch vụ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="detail-container">
        <div className="image-section">
          <div className="main-image-wrapper">
            <img
              src={getImageUrl(mainImage || getProductImage(product))}
              alt={product.name}
              className="main-image"
              onClick={() => setShowPreview(true)}
              onError={(event) => {
                event.currentTarget.src = fallbackImage;
              }}
            />

            <button
              type="button"
              className={`favorite ${favorite ? "active" : ""}`}
              onClick={() => setFavorite((prev) => !prev)}
              aria-label="Yêu thích dịch vụ"
            >
              ❤
            </button>
          </div>

          <div className="thumbnail-list">
            {productImages.map((imageName, index) => (
              <img
                key={`${imageName}-${index}`}
                src={getImageUrl(imageName)}
                alt={`${product.name} ${index + 1}`}
                className={`thumbnail ${mainImage === imageName ? "active" : ""}`}
                onClick={() => openImagePreview(imageName)}
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
            ))}
          </div>
        </div>

        <div className="info-section">
          <span className="detail-eyebrow">Ngọc Thiện Wedding</span>
          <h2>{product.name}</h2>

          <div className="rating-summary">
            <div className="rating-stars">{renderStarIcons(Math.round(averageRating))}</div>
            <div className="rating-summary-text">
              <strong>{averageRating > 0 ? averageRating.toFixed(1) : "5.0"}</strong>
              <span>{reviewCount} đánh giá từ khách hàng</span>
            </div>
          </div>

          <div className="price">{formatCurrency(product.price)}</div>

          <div className="service-meta">
            <div>
              <span>Tư vấn</span>
              <strong>Miễn phí theo nhu cầu tiệc</strong>
            </div>
            <div>
              <span>Đặt lịch</span>
              <strong>Cọc giữ ngày, thanh toán sau chương trình</strong>
            </div>
            <div>
              <span>Khu vực</span>
              <strong>Quảng Ngãi và khu vực lân cận</strong>
            </div>
          </div>

          <div className="quantity-box">
            <span>Số lượng / gói dịch vụ</span>
            <div className="quantity-controls">
              <button type="button" onClick={decreaseQty} aria-label="Giảm số lượng">
                -
              </button>
              <input
                value={quantity}
                onChange={(event) => {
                  const nextValue = Math.max(1, Number(event.target.value || 1));
                  setQuantity(
                    hasStockLimit ? Math.min(nextValue, Number(product.stock)) : nextValue
                  );
                }}
              />
              <button type="button" onClick={increaseQty} aria-label="Tăng số lượng">
                +
              </button>
            </div>
            <small>
              {hasStockLimit
                ? `Còn ${Number(product.stock).toLocaleString("vi-VN")} gói có thể đặt`
                : "Dịch vụ nhận đặt theo lịch cưới và quy mô thực tế"}
            </small>
          </div>

          <div className="actions">
            <button className="add-cart" type="button" onClick={addToCart}>
              Thêm vào giỏ
            </button>
            <button className="buy-now" type="button" onClick={buyNow}>
              Đặt dịch vụ ngay
            </button>
          </div>

          <button className="consult-detail-btn" type="button" onClick={() => navigate("/")}>
            Liên hệ tư vấn chi tiết
          </button>
        </div>
      </div>

      <div className="description-section">
        <h3>Mô tả dịch vụ</h3>
        <div className="description-content">
          {descriptionSections.length ? (
            descriptionSections.map((section, index) => {
              const rows = getKnownSectionRows(section.title, section.content);
              const isDistanceTable = section.title
                .toLowerCase()
                .includes("khoảng cách");
              const isListSection = [
                "Dịch vụ bao gồm",
                "Nâng cấp thêm",
                "Điểm nổi bật",
                "Phù hợp cho",
                "Ưu đãi",
              ].includes(section.title);
              const items = splitDescriptionItems(section.content);

              return (
                <section className="description-block" key={`${section.title}-${index}`}>
                  {section.title && <h4>{section.title}</h4>}

                  {rows.length > 0 ? (
                    <div className="description-table-wrap">
                      <table className="description-table">
                        <thead>
                          <tr>
                            {isDistanceTable ? (
                              <>
                                <th>Gói dịch vụ</th>
                                <th>Khoảng cách</th>
                                <th>Giá</th>
                              </>
                            ) : (
                              <>
                                <th>Loại xe</th>
                                <th>Giá từ</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.join("-")}>
                              {row.map((cell) => (
                                <td key={cell}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : isListSection && items.length > 1 ? (
                    <ul className="description-list">
                      {items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{section.content}</p>
                  )}
                </section>
              );
            })
          ) : (
            <p>Dịch vụ đang được cập nhật mô tả chi tiết.</p>
          )}
        </div>

        <h3>Hình ảnh dịch vụ</h3>
        <div className="extra-images">
          {productImages.map((imageName, index) => (
            <img
              key={`${imageName}-extra-${index}`}
              src={getImageUrl(imageName)}
              alt={`${product.name} ${index + 1}`}
              onClick={() => openImagePreview(imageName)}
              onError={(event) => {
                event.currentTarget.src = fallbackImage;
              }}
            />
          ))}
        </div>

        <div className="reviews-section">
          <div className="reviews-header">
            <div>
              <h3>Khách hàng đánh giá</h3>
              <p>
                Những chia sẻ từ khách hàng đã sử dụng dịch vụ của Ngọc Thiện Wedding.
              </p>
            </div>
            <div className="reviews-overview">
              <strong>{averageRating > 0 ? averageRating.toFixed(1) : "5.0"}</strong>
              <span>{reviewCount} lượt đánh giá</span>
            </div>
          </div>

          <div className={`review-form ${reviewEligibility.canReview ? "" : "locked"}`}>
            <div className="review-eligibility">
              {reviewEligibility.loading ? "Đang kiểm tra điều kiện đánh giá..." : reviewEligibility.message}
            </div>
            <div className="review-form__stars">
              <span>Chọn số sao của bạn</span>
              <div className="interactive-stars">
                {renderStarIcons(reviewForm.rating, reviewEligibility.canReview, (value) =>
                  setReviewForm((prev) => ({ ...prev, rating: value }))
                )}
              </div>
            </div>

            <textarea
              placeholder="Hãy chia sẻ cảm nhận của bạn về dịch vụ này..."
              value={reviewForm.comment}
              onChange={(event) =>
                setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
              }
              rows={4}
              disabled={!reviewEligibility.canReview}
            />

            <button
              className="submit-review"
              type="button"
              onClick={submitReview}
              disabled={submittingReview || !reviewEligibility.canReview}
            >
              {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>

          {reviewLoading ? (
            <div className="reviews-empty">Đang tải đánh giá...</div>
          ) : reviewError ? (
            <div className="reviews-empty">{reviewError}</div>
          ) : reviews.length === 0 ? (
            <div className="reviews-empty">
              Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận của bạn.
            </div>
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
                    <span>{new Date(review.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <p>{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="image-modal" onClick={() => setShowPreview(false)}>
          <img
            src={getImageUrl(mainImage || getProductImage(product))}
            alt="Preview"
            className="modal-image"
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
