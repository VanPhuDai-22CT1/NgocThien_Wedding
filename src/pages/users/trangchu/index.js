import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ChatBot from "../../../component/chatbot/index";
import { getAuthItem } from "utils/authStorage";
import { addGuestCartItem } from "utils/guestCart";
import { getImageUrl, getProductImage } from "utils/image";
import {
  FaEye,
  FaShoppingCart,
  FaUsers,
  FaShieldAlt,
  FaTags,
  FaHeadset,
  FaStar,
  FaGift,
  FaTimes,
} from "react-icons/fa";
import "./style.scss";
import useScrollReveal from "../../../hooks/useScrollReveal";


// ===== IMPORT ẢNH KHOẢNH KHẮC =====
import nennb1 from "assets/users/images/hero/a1.jpg";
import nennb2 from "assets/users/images/hero/a2.jpg";
import nennb3 from "assets/users/images/hero/a3.jpg";
import nennb4 from "assets/users/images/hero/a4.jpg";
import nennb5 from "assets/users/images/hero/a5.jpg";
import nennb6 from "assets/users/images/hero/a6.jpg";
import nennb7 from "assets/users/images/hero/a7.jpg";

// ===== AVATAR KHÁCH HÀNG =====
// avatar images removed (testimonials deleted)

const API_BASE = "/api";
const CUSTOMIZE_API = `${API_BASE}/homepage-config`;

const toSiteImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `/${path.replace(/^\/+/, "")}`;
};

const HomePage = () => {
  useScrollReveal();

  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [aiRecommendedProducts, setAiRecommendedProducts] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [, setCart] = useState([]);
  const [showProducts] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);
  const [showTeamInfo, setShowTeamInfo] = useState(false);
  const [showQualityInfo, setShowQualityInfo] = useState(false);
  const [showPriceInfo, setShowPriceInfo] = useState(false);
  const [showSupportInfo, setShowSupportInfo] = useState(false);
  const [showRatingInfo, setShowRatingInfo] = useState(false);
  const [showGiftInfo, setShowGiftInfo] = useState(false);
  const [homepageImages, setHomepageImages] = useState({
    galleryImages: Array(7).fill(""),
    consultImage: "",
  });

  const resolvedGalleryImages = useMemo(() => [
    toSiteImageUrl(homepageImages.galleryImages[0]) || nennb1,
    toSiteImageUrl(homepageImages.galleryImages[1]) || nennb2,
    toSiteImageUrl(homepageImages.galleryImages[2]) || nennb3,
    toSiteImageUrl(homepageImages.galleryImages[3]) || nennb4,
    toSiteImageUrl(homepageImages.galleryImages[4]) || nennb5,
    toSiteImageUrl(homepageImages.galleryImages[5]) || nennb6,
    toSiteImageUrl(homepageImages.galleryImages[6]) || nennb7,
  ], [homepageImages.galleryImages]);

  const consultImage = useMemo(
    () => toSiteImageUrl(homepageImages.consultImage) || nennb2,
    [homepageImages.consultImage]
  );

  // ===== CONSULT FORM STATE =====
  const [consultData, setConsultData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    note: "",
    agree: false,
  });
  const [bookedDates, setBookedDates] = useState([]);

  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const minEventDate = useMemo(() => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    return formatDateInput(minDate);
  }, []);

  const bookedDateSet = useMemo(() => new Set(bookedDates), [bookedDates]);
  const displayProducts = useMemo(
    () => (featuredProducts.length > 0 ? featuredProducts : products),
    [featuredProducts, products]
  );
  const discountByProductId = useMemo(() => {
    const map = new Map();
    displayProducts.forEach((product, idx) => {
      if (idx % 3 === 0) {
        map.set(product.id, 10 + (Number(product.id || idx) % 20));
      }
    });
    return map;
  }, [displayProducts]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setConsultData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleSubmitConsult = async (e) => {
  e.preventDefault();

  if (!consultData.agree) {
    alert("Bạn cần đồng ý điều khoản");
    return;
  }

  if (!consultData.date) {
    alert("Vui lòng chọn ngày tổ chức tiệc");
    return;
  }

  if (consultData.date < minEventDate) {
    alert("Ngày đặt tiệc phải cách ngày hiện tại ít nhất 2 ngày.");
    return;
  }

  if (bookedDateSet.has(consultData.date)) {
    alert("Ngày này đã có tiệc, vui lòng chọn ngày khác");
    return;
  }

  try {
    const res = await axios.post(
      `${API_BASE}/legacy`,
      {
        action: "addConsultation",
        user_id: Number(getAuthItem("user_id") || 0) || null,
        name: consultData.name,
        email: consultData.email,
        phone: consultData.phone,
        service: consultData.service,
        event_date: consultData.date,
        note: consultData.note,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    if (res.data.success) {
      alert("Gửi thông tin thành công!");
      const bookedRes = await axios.get(`${API_BASE}/legacy?action=getBookedEventDates`);
      if (bookedRes.data?.success) {
        setBookedDates((bookedRes.data.data || []).map((item) => item.event_date));
      }
    } else {
      alert(res.data?.message || "Gửi thất bại!");
    }

  } catch (error) {
    alert("Lỗi kết nối server!");
  }

  setConsultData({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    note: "",
    agree: false,
  });
};

useEffect(() => {
  if (!showTeamInfo && !showQualityInfo && !showPriceInfo && !showSupportInfo && !showRatingInfo && !showGiftInfo) return undefined;

  const handleEsc = (e) => {
    if (e.key === "Escape") {
      setShowTeamInfo(false);
      setShowQualityInfo(false);
      setShowPriceInfo(false);
      setShowSupportInfo(false);
      setShowRatingInfo(false);
      setShowGiftInfo(false);
    }
  };

  window.addEventListener("keydown", handleEsc);
  return () => window.removeEventListener("keydown", handleEsc);
}, [showTeamInfo, showQualityInfo, showPriceInfo, showSupportInfo, showRatingInfo, showGiftInfo]);

  useEffect(() => {
    const controller = new AbortController();

    axios
      .get(`${CUSTOMIZE_API}?action=getHomepageImages`, { signal: controller.signal })
      .then((res) => {
        if (res.data?.success) {
          const data = res.data.data || {};
          const gallery = Array.isArray(data.galleryImages)
            ? [...data.galleryImages, ...Array(7).fill("")].slice(0, 7)
            : Array(7).fill("");

          setHomepageImages({
            galleryImages: gallery,
            consultImage: data.consultImage || "",
          });
        }
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        console.error("Load homepage images error:", err);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    axios
      .get(`${API_BASE}/legacy?action=getBookedEventDates`, { signal: controller.signal })
      .then((res) => {
        if (res.data?.success) {
          setBookedDates((res.data.data || []).map((item) => item.event_date));
        }
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        console.error("Load booked dates error:", err);
      });

    return () => controller.abort();
  }, []);

  const loadAiRecommendations = async (fallbackProducts = [], signal) => {
    try {
      setAiLoading(true);
      setAiError("");

      const res = await axios.get(`${API_BASE}/legacy?action=getAiRecommendations&limit=4`, { signal });
      const aiData = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];

      if (aiData.length > 0) {
        setAiRecommendedProducts(aiData);
      } else {
        const fallback = (fallbackProducts || [])
          .filter((p) => Number(p.is_featured) === 1)
          .slice(0, 4);
        setAiRecommendedProducts(fallback);
        setAiError("AI tạm thời chưa có dữ liệu phân tích, đang hiển thị gợi ý từ sản phẩm nổi bật.");
      }
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("AI recommendation error:", err);
      const fallback = (fallbackProducts || [])
        .filter((p) => Number(p.is_featured) === 1)
        .slice(0, 4);
      setAiRecommendedProducts(fallback);
      setAiError("Không tải được AI đề xuất, đang hiển thị gợi ý thay thế.");
    } finally {
      setAiLoading(false);
    }
  };

  // ===== LOAD SẢN PHẨM =====
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/legacy?action=getProducts`, { signal: controller.signal });
        if (res.data?.success) {
          const allProducts = Array.isArray(res.data.data) ? res.data.data : [];
          setProducts(allProducts.slice(0, 8));

          const featured = allProducts
            .filter((p) => Number(p.is_featured) === 1)
            .slice(0, 8);
          setFeaturedProducts(featured);

          await loadAiRecommendations(allProducts, controller.signal);
        } else {
          setProducts([]);
          setFeaturedProducts([]);
          await loadAiRecommendations([], controller.signal);
        }
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error(err);
        setProducts([]);
        setFeaturedProducts([]);
        await loadAiRecommendations([], controller.signal);
      }

      fetchCart(controller.signal);
    };

    loadData();

    return () => controller.abort();
  }, []);

const addToCart = (productId) => {
  const userId = Number(getAuthItem("user_id"));
  const selectedProduct = products.find(
    (item) => Number(item.id) === Number(productId)
  );

  if (!userId) {
    addGuestCartItem({
      productId,
      name: selectedProduct?.name,
      price: Number(selectedProduct?.price || 0),
      cover: getProductImage(selectedProduct),
    });
    alert("Đã thêm sản phẩm vào giỏ hàng");
    return;
  }

  axios
    .post(
      `${API_BASE}/legacy`,
      {
        action: "addToCart",
        productId,
        quantity: 1,
        userId: userId
      },
      { headers: { "Content-Type": "application/json" } }
    )
    .then((res) => {
      if (res.data.success) {
        alert("Đã thêm sản phẩm vào giỏ hàng");
      } else {
        alert(res.data.message || "Thêm giỏ hàng thất bại");
      }
    })
    .catch(() => alert("Lỗi thêm giỏ hàng"));
};


  const fetchCart = (signal) => {
  const userId = Number(getAuthItem("user_id"));
  if (!userId) return;

  axios
    .post(
      `${API_BASE}/legacy`,
      {
        action: "getCart",
        userId,
      },
      { signal }
    )
    .then((res) => {
      if (res.data.success) setCart(res.data.cart);
    })
    .catch((err) => {
      if (!axios.isCancel(err)) console.error(err);
    });
};
  return (
    <div className="home-page-shell">
      {/* ================= CAM KẾT KHÁCH HÀNG ================= */}
      <section className="commit-section reveal commitment-section">
        <div className="commit-wrapper">
          <div className="commit-header">
            <span className="commit-badge">💍 Tại sao chọn chúng tôi</span>
            <h2>
              Cam Kết Của Chúng Tôi <span>Với Khách Hàng</span>
            </h2>
            <p>
              Với chúng tôi, một lễ cưới đẹp không nằm ở sự phô trương, mà ở
              cảm giác an tâm khi mọi chi tiết được chăm chút bằng sự tử tế,
              trách nhiệm và lòng trân trọng dành cho từng gia đình.
            </p>
          </div>

          <div className="commit-grid">
            <button
              type="button"
              className="commit-card team-trigger"
              onClick={() => setShowTeamInfo(true)}
            >
              <FaUsers />
              <h4>Đội ngũ chuyên nghiệp</h4>
              <p>Nhân sự giàu kinh nghiệm, tận tâm</p>
            </button>

            <button
              type="button"
              className="commit-card team-trigger"
              onClick={() => setShowQualityInfo(true)}
            >
              <FaShieldAlt />
              <h4>Cam kết chất lượng</h4>
              <p>Hoàn tiền 100% nếu không hài lòng</p>
            </button>

            <button
              type="button"
              className="commit-card team-trigger"
              onClick={() => setShowPriceInfo(true)}
            >
              <FaTags />
              <h4>Giá cả cạnh tranh</h4>
              <p>Minh bạch chi phí, nhiều ưu đãi</p>
            </button>

            <button
              type="button"
              className="commit-card team-trigger"
              onClick={() => setShowSupportInfo(true)}
            >
              <FaHeadset />
              <h4>Hỗ trợ 24/7</h4>
              <p>Tư vấn nhanh chóng mọi lúc</p>
            </button>

            <button
              type="button"
              className="commit-card team-trigger"
              onClick={() => setShowRatingInfo(true)}
            >
              <FaStar />
              <h4>Đánh giá cao</h4>
              <p>98% khách hàng hài lòng</p>
            </button>

            <button
              type="button"
              className="commit-card team-trigger"
              onClick={() => setShowGiftInfo(true)}
            >
              <FaGift />
              <h4>Quà tặng hấp dẫn</h4>
              <p>Ưu đãi đặc biệt cho khách hàng mới</p>
            </button>
          </div>
        </div>
      </section>

      {showTeamInfo && (
        <div
          className="team-info-overlay"
          onClick={() => setShowTeamInfo(false)}
        >
          <div
            className="team-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="team-close-btn"
              onClick={() => setShowTeamInfo(false)}
              aria-label="Đóng"
            >
              <FaTimes />
            </button>

            <h3>Đội ngũ chuyên nghiệp của chúng tôi</h3>
            <p className="team-intro">
              Từ năm 2009 đến nay, chúng tôi theo đuổi một triết lý nhất quán:
              làm nghề bằng kỷ luật của người chuyên nghiệp và trái tim của
              người đồng hành, để mỗi ngày vui đều trọn vẹn cảm xúc.
            </p>

            <div className="team-members">
              <div className="member-card">
                <h4>Văn Cao Thiện</h4>
                <span>Người đứng đầu đội ngũ</span>
                <p>
                  Trực tiếp định hướng chiến lược phát triển, tiêu chuẩn dịch vụ
                  và chất lượng vận hành tổng thể của toàn bộ đội ngũ từ năm
                  2009 đến nay.
                </p>
              </div>

              <div className="member-card">
                <h4>Nguyễn Thị Nhiều</h4>
                <span>Điều phối dịch vụ</span>
                <p>
                  Chịu trách nhiệm điều phối kế hoạch, theo sát tiến độ từng khâu
                  và đảm bảo trải nghiệm chỉnh chu cho khách hàng trong ngày cưới.
                </p>
              </div>

              <div className="member-card">
                <h4>Văn Phú Liên</h4>
                <span>Quản lý hậu cần</span>
                <p>
                  Phụ trách vận hành hậu cần, nhân sự hiện trường và xử lý tình
                  huống linh hoạt để chương trình diễn ra đúng kế hoạch.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQualityInfo && (
        <div
          className="team-info-overlay"
          onClick={() => setShowQualityInfo(false)}
        >
          <div
            className="team-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="team-close-btn"
              onClick={() => setShowQualityInfo(false)}
              aria-label="Đóng"
            >
              <FaTimes />
            </button>

            <h3>Cam kết về chất lượng</h3>
            <p className="team-intro">
              Chất lượng, với chúng tôi, không chỉ là kết quả cuối cùng mà là
              chuẩn mực trong từng bước thực hiện: rõ ràng, đúng hẹn, chỉnh chu
              và nhất quán từ khâu tư vấn đến vận hành sự kiện.
            </p>

            <div className="team-members">
              <div className="member-card">
                <h4>Tiêu chuẩn dịch vụ rõ ràng</h4>
                <span>Quy trình minh bạch</span>
                <p>
                  Mọi hạng mục đều được thống nhất bằng kế hoạch chi tiết, có đầu
                  việc, thời gian và người phụ trách cụ thể.
                </p>
              </div>

              <div className="member-card">
                <h4>Kiểm tra chất lượng nhiều lớp</h4>
                <span>Giám sát trước sự kiện</span>
                <p>
                  Hệ thống kiểm tra nội bộ được thực hiện trước ngày cưới để giảm
                  thiểu sai sót và đảm bảo đồng bộ giữa các bộ phận.
                </p>
              </div>

              <div className="member-card">
                <h4>Cam kết xử lý sự cố nhanh</h4>
                <span>Đội ngũ phản ứng trực tiếp</span>
                <p>
                  Luôn có phương án dự phòng và nhân sự túc trực, sẵn sàng xử lý
                  vấn đề phát sinh để chương trình diễn ra trọn vẹn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPriceInfo && (
        <div
          className="team-info-overlay"
          onClick={() => setShowPriceInfo(false)}
        >
          <div
            className="team-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="team-close-btn"
              onClick={() => setShowPriceInfo(false)}
              aria-label="Đóng"
            >
              <FaTimes />
            </button>

            <h3>Giá cả cạnh tranh</h3>
            <p className="team-intro">
              Chúng tôi tin rằng giá trị bền vững đến từ sự minh bạch. Vì vậy,
              mọi mức giá đều được xây dựng công bằng, rõ ràng và tương xứng với
              chất lượng thực tế, để khách hàng an tâm khi lựa chọn.
            </p>

            <div className="team-members">
              <div className="member-card">
                <h4>Bảng giá minh bạch</h4>
                <span>Không phát sinh mơ hồ</span>
                <p>
                  Từng hạng mục đều có báo giá chi tiết, dễ theo dõi và được xác
                  nhận trước khi triển khai.
                </p>
              </div>

              <div className="member-card">
                <h4>Nhiều gói linh hoạt</h4>
                <span>Phù hợp nhiều ngân sách</span>
                <p>
                  Cung cấp đa dạng gói dịch vụ từ cơ bản đến cao cấp để khách
                  hàng dễ dàng lựa chọn theo nhu cầu thực tế.
                </p>
              </div>

              <div className="member-card">
                <h4>Giá trị vượt chi phí</h4>
                <span>Tối ưu hiệu quả đầu tư</span>
                <p>
                  Tập trung vào chất lượng đầu ra và trải nghiệm trọn vẹn, bảo đảm
                  mỗi khoản chi đều mang lại giá trị rõ ràng.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSupportInfo && (
        <div
          className="team-info-overlay"
          onClick={() => setShowSupportInfo(false)}
        >
          <div
            className="team-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="team-close-btn"
              onClick={() => setShowSupportInfo(false)}
              aria-label="Đóng"
            >
              <FaTimes />
            </button>

            <h3>Ngọc Thiện Wedding</h3>
            <p className="team-intro">
              Trân trọng gửi bạn thông tin hóa đơn và liên hệ được trình bày rõ
              ràng, đầy đủ, giúp quá trình theo dõi và xác nhận thuận tiện hơn.
            </p>

            <div className="team-members">
              <div className="member-card">
                <h4>Thông tin cửa hàng</h4>
                <span>Chi tiết liên hệ</span>
                <p>Địa chỉ: Quảng Ngãi City</p>
                <p>Hotline: 0367 234 139</p>
                <p>Mã HĐ: #40</p>
                <p>Ngày: 12:07:46 11/3/2026</p>
              </div>

              <div className="member-card">
                <h4>HÓA ĐƠN THANH TOÁN</h4>
                <span>Khách hàng và đơn hàng</span>
                <p>Khách hàng: vanphudai24122004@gmail.com</p>
                <p>SDT: 0367234139</p>
                <p>Địa chỉ: 72/2 Lê Cơ</p>
                <p>Phương thức: tiền mặt</p>
                <p>Trạng thái: Đang xử lý</p>
              </div>

              <div className="member-card">
                <h4>Sản phẩm và thanh toán</h4>
                <span>Chi tiết giao dịch</span>
                <p>STT 1: Bảng Tên Đám Cưới Thiết Kế Đẹp - In Theo Yêu Cầu</p>
                <p>Số lượng: 1</p>
                <p>Đơn giá: 850.000 đ</p>
                <p>Thành tiền: 850.000 đ</p>
                <p>Tổng thanh toán: 850.000 đ</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRatingInfo && (
        <div
          className="team-info-overlay"
          onClick={() => setShowRatingInfo(false)}
        >
          <div
            className="team-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="team-close-btn"
              onClick={() => setShowRatingInfo(false)}
              aria-label="Đóng"
            >
              <FaTimes />
            </button>

            <h3>Đánh giá cao từ khách hàng</h3>
            <p className="team-intro">
              Sự hài lòng của khách hàng là thước đo chân thật nhất cho chất
              lượng dịch vụ. Mỗi phản hồi tích cực là động lực để chúng tôi giữ
              vững chuẩn mực và không ngừng hoàn thiện từng ngày.
            </p>

            <div className="team-members">
              <div className="member-card">
                <h4>Tỷ lệ hài lòng 98%</h4>
                <span>Khảo sát sau dịch vụ</span>
                <p>
                  Khách hàng đánh giá cao sự chuyên nghiệp, đúng giờ và tinh thần
                  hỗ trợ tận tâm của đội ngũ trong suốt quá trình thực hiện.
                </p>
              </div>

              <div className="member-card">
                <h4>Phản hồi tích cực liên tục</h4>
                <span>Uy tín bền vững</span>
                <p>
                  Chúng tôi liên tục nhận được phản hồi tốt về thái độ phục vụ,
                  chất lượng đầu ra và khả năng xử lý tình huống nhanh chóng.
                </p>
              </div>

              <div className="member-card">
                <h4>Cam kết cải tiến thường xuyên</h4>
                <span>Lắng nghe và nâng cấp</span>
                <p>
                  Mọi góp ý đều được ghi nhận và chuyển thành kế hoạch nâng cấp
                  dịch vụ để mang đến trải nghiệm ngày càng hoàn thiện.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGiftInfo && (
        <div
          className="team-info-overlay"
          onClick={() => setShowGiftInfo(false)}
        >
          <div
            className="team-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="team-close-btn"
              onClick={() => setShowGiftInfo(false)}
              aria-label="Đóng"
            >
              <FaTimes />
            </button>

            <h3>Quà tặng hấp dẫn</h3>
            <p className="team-intro">
              Mỗi ưu đãi chúng tôi gửi tặng không chỉ là quà, mà là lời cảm ơn
              chân thành dành cho sự tin tưởng ban đầu, để hành trình đồng hành
              cùng khách hàng khởi đầu bằng niềm vui và sự trân trọng.
            </p>

            <div className="team-members">
              <div className="member-card">
                <h4>Ưu đãi khách hàng mới</h4>
                <span>Áp dụng khi đặt dịch vụ</span>
                <p>
                  Khách hàng lần đầu sử dụng dịch vụ sẽ nhận ưu đãi đặc biệt theo
                  từng gói, giúp tối ưu ngân sách hiệu quả.
                </p>
              </div>

              <div className="member-card">
                <h4>Quà tặng kèm theo gói</h4>
                <span>Giá trị thiết thực</span>
                <p>
                  Tặng thêm hạng mục hỗ trợ hoặc phụ kiện đi kèm để nâng cao trải
                  nghiệm trong suốt quá trình tổ chức.
                </p>
              </div>

              <div className="member-card">
                <h4>Tư vấn ưu đãi cá nhân hóa</h4>
                <span>Phù hợp nhu cầu thực tế</span>
                <p>
                  Đội ngũ sẽ tư vấn lựa chọn chương trình ưu đãi phù hợp nhất với
                  ngân sách và phong cách của từng khách hàng.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SẢN PHẨM NỔI BẬT ================= */}
      <section className="commit-section reveal featured-products-section">
        <div className="commit-wrapper">
          <section className="product-list">
            <h2>Sản Phẩm <span>Nổi Bật</span></h2>
            
            <div className="product-trust-row">
              <div className="product-trust-stars">
                {"★★★★★"}
              </div>
              <span className="product-trust-text">
                98% Khách hàng hài lòng • 2.5K+ đánh giá
              </span>
            </div>

              {showProducts && (
              <div className="product-grid">
                {displayProducts.map((product) => (
                  <div className="product-card reveal-item" key={product.id}>
                    <div className="product-image-container">
                      {discountByProductId.has(product.id) && (
                        <div className="product-discount-badge">
                          -{discountByProductId.get(product.id)}%
                        </div>
                      )}
                      <img
                        src={getImageUrl(getProductImage(product))}
                        alt={product.name}
                        onError={(e) =>
                          (e.target.src =
                            "https://via.placeholder.com/400x400?text=No+Image")
                        }
                      />

                      <div className="product-actions">
                        <Link to={`/chitietsanpham/${product.id}`}>
                          <button className="action-btn view-btn" title="Xem chi tiết">
                            <FaEye />
                          </button>
                        </Link>

                        <button
                          className="action-btn add-btn"
                          onClick={() => addToCart(product.id)}
                          title="Thêm vào giỏ hàng"
                        >
                          <FaShoppingCart />
                        </button>
                      </div>
                    </div>

                    <div className="product-rating-spacer">
                      {/* Rating đã chuyển xuống dưới */}
                    </div>

                    <h3>{product.name}</h3>
                    <p className="price">
                      {Number(product.price).toLocaleString()} VND
                    </p>

                    <div className="tc-product-rating">
                      {(() => {
                        const avg = Number(product.average_rating || 0);
                        const cnt = Number(product.review_count || 0);
                        const filled = Math.max(0, Math.min(5, Math.round(avg)));
                        if (cnt === 0) return <span className="tc-no-review">Chưa có đánh giá</span>;
                        return (
                          <>
                            <span className="tc-stars">{"★".repeat(filled)}{"☆".repeat(5 - filled)}</span>
                            <span className="tc-meta">
                              <span className="tc-score">{avg.toFixed(1)}/5</span>
                              <span className="tc-dot">•</span>
                              <span className="tc-count">{cnt} đánh giá</span>
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="view-all-wrap">
              <Link to="/sanpham" className="view-all-btn">
                Xem Tất Cả <span className="arrow">→</span>
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="commit-section reveal">
        <div className="commit-wrapper ai-suggest-wrapper">
          <div className="ai-suggest-header">
            <span>AI đề xuất</span>
            <h2>Gợi Ý Dịch Vụ Phù Hợp Với Bạn</h2>
            <p>
              Hệ thống AI phân tích mức độ nổi bật, đánh giá khách hàng và xu hướng đặt dịch vụ
              để đề xuất các gói đang được quan tâm nhất.
            </p>
          </div>

          {aiLoading ? (
            <div className="ai-empty">Đang phân tích dữ liệu để đề xuất dịch vụ phù hợp...</div>
          ) : aiRecommendedProducts.length === 0 ? (
            <div className="ai-empty">Hiện chưa có đủ dữ liệu để AI đề xuất sản phẩm phù hợp.</div>
          ) : (
            <>
              {aiError && <div className="ai-empty warning">{aiError}</div>}
              <div className="product-grid ai-grid">
                {aiRecommendedProducts.map((product) => (
                  <div className="product-card reveal-item ai-card" key={`ai-${product.id}`}>
                    <div className="product-image-container">
                      <div className="ai-badge">AI Gợi Ý</div>
                      <img
                        src={getImageUrl(getProductImage(product))}
                        alt={product.name}
                        onError={(e) =>
                          (e.target.src =
                            "https://via.placeholder.com/400x400?text=No+Image")
                        }
                      />

                      <div className="product-actions">
                        <Link to={`/chitietsanpham/${product.id}`}>
                          <button className="action-btn view-btn" title="Xem chi tiết">
                            <FaEye />
                          </button>
                        </Link>

                        <button
                          className="action-btn add-btn"
                          onClick={() => addToCart(product.id)}
                          title="Thêm vào giỏ hàng"
                        >
                          <FaShoppingCart />
                        </button>
                      </div>
                    </div>

                    <h3>{product.name}</h3>
                    <p className="price">{Number(product.price).toLocaleString()} VND</p>

                    <div className="ai-meta">
                      <div className="ai-rating">
                        ⭐ {Number(product.average_rating || 0).toFixed(1)}
                        <span>({Number(product.review_count || 0)} đánh giá)</span>
                      </div>
                      <p>{product.ai_reason || "Được gợi ý theo mức độ quan tâm của khách hàng"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>


      {/* ================= KHOẢNH KHẮC ĐÁNG NHỚ ================= */}
     <section className="memories-section reveal">
        <div className="memories-wrapper">
         <div className="memories-header">
        <section className="title-wrapper">
          <h2 className="section-title">Những Sản Phẩm Nổi Bật</h2>
        </section>

      

      </div>


          <div className="memories-grid">
            <div
            className="memory-item item-large"
              onClick={() => setPreviewImg(resolvedGalleryImages[0])}
          >
              <img src={resolvedGalleryImages[0]} alt="Khoảnh khắc 1" />
          </div>

            <div className="memory-item" onClick={() => setPreviewImg(resolvedGalleryImages[1])}>
              <img src={resolvedGalleryImages[1]} alt="Khoảnh khắc 2" />
          </div>

            <div className="memory-item" onClick={() => setPreviewImg(resolvedGalleryImages[2])}>
              <img src={resolvedGalleryImages[2]} alt="Khoảnh khắc 3" />
          </div>

            <div className="memory-item item-wide" onClick={() => setPreviewImg(resolvedGalleryImages[3])}>
              <img src={resolvedGalleryImages[3]} alt="Khoảnh khắc 4" />
          </div>

            <div className="memory-item" onClick={() => setPreviewImg(resolvedGalleryImages[4])}>
              <img src={resolvedGalleryImages[4]} alt="Khoáº£nh kháº¯c 5" />
          </div>

            <div className="memory-item" onClick={() => setPreviewImg(resolvedGalleryImages[5])}>
              <img src={resolvedGalleryImages[5]} alt="Khoáº£nh kháº¯c 6" />
          </div>

            <div className="memory-item item-wide" onClick={() => setPreviewImg(resolvedGalleryImages[6])}>
              <img src={resolvedGalleryImages[6]} alt="Khoáº£nh kháº¯c 7" />
          </div>


          </div>
        </div>
      </section>

      {/* Testimonial section removed per request */}

 <section className="commit-section">
        <div className="commit-wrapper">
          <div className="consult-wrapper">

            <div className="consult-form-box">
              <h2 className="section-title">
                Bắt Đầu Hành Trình <br />
                <span>Của Bạn</span>
              </h2>

              <form className="consult-form" onSubmit={handleSubmitConsult}>

                <input
                  type="text"
                  name="name"
                  placeholder="Họ và tên *"
                  value={consultData.name}
                  onChange={handleChange}
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={consultData.email}
                  onChange={handleChange}
                  required
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Số điện thoại *"
                  value={consultData.phone}
                  onChange={handleChange}
                  required
                />

                <select
                  name="service"
                  value={consultData.service}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn gói dịch vụ</option>
                  <option value="Chụp ảnh cưới">Chụp ảnh cưới</option>
                  <option value="Trang trí tiệc cưới">Trang trí tiệc cưới</option>
                  <option value="Tổ chức trọn gói">Tổ chức trọn gói</option>
                </select>

                <input
                  type="date"
                  name="date"
                  min={minEventDate}
                  value={consultData.date}
                  onChange={handleChange}
                  required
                />

                {consultData.date && bookedDateSet.has(consultData.date) && (
                  <p className="booked-date-warning">
                    Ngày này đã có tiệc, vui lòng chọn ngày khác.
                  </p>
                )}

                <textarea
                  rows="4"
                  name="note"
                  placeholder="Ghi chú thêm"
                  value={consultData.note}
                  onChange={handleChange}
                />

                <label className="terms-checkbox">
                  <input
                    type="checkbox"
                    name="agree"
                    checked={consultData.agree}
                    onChange={handleChange}
                  />
                  Tôi đồng ý điều khoản
                </label>

                <button type="submit" className="consult-btn">
                  Gửi Thông Tin
                </button>

              </form>
            </div>

            <div className="consult-image">
              <img src={consultImage} alt="Wedding consult" />
            </div>

          </div>
        </div>
      </section>

      {previewImg && (
        <div
          className="image-preview-overlay"
          onClick={() => setPreviewImg(null)}
        >
          <img src={previewImg} alt="Preview" />
        </div>
      )}
      <ChatBot />
    </div>
  );
};
export default HomePage;


