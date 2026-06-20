import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheck,
  FaHome,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRegCalendarAlt,
  FaUser,
} from "react-icons/fa";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import logo from "assets/users/images/icondau/logodvkv.png";
import "./style.scss";

const FALLBACK_ITEMS = [
  { product_name: "Dịch vụ cưới hỏi trọn gói", quantity: 1, product_price: 0 },
];

const parseEventDate = (note = "") => {
  const match =
    note.match(/(?:ngày tổ chức|ngày tiệc|event date|wedding date)\s*[:|-]\s*([^.|,\n]+)/i) ||
    note.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{4})/);

  return match ? match[1].trim() : "";
};

const parsePartyType = (note = "") => {
  const match = note.match(/(?:loại tiệc|dịch vụ|service)\s*[:|-]\s*([^.|,\n]+)/i);
  return match ? match[1].trim() : "Tiệc cưới";
};

const normalizeStatus = (status = "") => {
  const value = String(status).toLowerCase();
  if (value === "pending") return "Đang xử lý";
  if (value === "confirmed") return "Đã xác nhận";
  if (value === "processing") return "Đang chuẩn bị";
  if (value === "shipping") return "Đang bàn giao";
  if (value === "delivered") return "Đã bàn giao";
  if (value === "cancelled") return "Đã hủy";
  return status || "Đang xử lý";
};

const HoaDon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/orders/${id}`, {
          headers: buildAuthHeaders(),
        });
        const data = res.data || {};

        if (data.success) {
          const orderData = data.data || {};
          const note = orderData.note || "";

          setOrder({
            order_id: orderData.id,
            order_code: orderData.order_code || `HD-2026-${String(orderData.id || id).padStart(3, "0")}`,
            order_time: orderData.created_at,
            customer_name: orderData.customer_name || orderData.email || "Khách hàng",
            phone: orderData.phone || "",
            address: orderData.delivery_address || "",
            email: orderData.email || "",
            payment_method: orderData.payment_method || "cash",
            payment_status: orderData.payment_status || "pending",
            status: normalizeStatus(orderData.status),
            total: Number(orderData.total_amount || 0),
            note,
            event_date: orderData.event_date || parseEventDate(note),
            party_type: parsePartyType(note),
          });

          const mappedDetails = Array.isArray(orderData.OrderItems)
            ? orderData.OrderItems.map((item) => ({
                product_name: item.Product?.name || "Dịch vụ cưới",
                quantity: Number(item.quantity || 1),
                unit: Number(item.quantity || 1) > 1 ? "phần" : "gói",
                product_price: Number(item.price || 0),
              }))
            : [];

          setDetails(mappedDetails);
        } else {
          setError("Không tìm thấy hóa đơn.");
        }
      } catch (err) {
        setError("Lỗi kết nối server.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const invoiceItems = useMemo(() => {
    if (details.length > 0) return details;
    if (!order) return FALLBACK_ITEMS;

    return [
      {
        product_name: "Dịch vụ cưới hỏi trọn gói",
        quantity: 1,
        unit: "gói",
        product_price: order.total,
      },
    ];
  }, [details, order]);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " VNĐ";

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("vi-VN");
  };

  const subtotal = invoiceItems.reduce(
    (sum, item) => sum + Number(item.quantity || 1) * Number(item.product_price || 0),
    0
  );
  const total = order?.total || subtotal;

  return (
    <div className="invoice-wrapper">
      <div className="invoice-paper">
        {loading && <div className="invoice-state">Đang tải hóa đơn...</div>}

        {!loading && error && <div className="invoice-state error">{error}</div>}

        {!loading && !error && order && (
          <>
            <div className="corner corner-tl" />
            <div className="corner corner-tr" />
            <div className="corner corner-bl" />
            <div className="corner corner-br" />

            <header className="invoice-brand">
              <div className="invoice-logo-block">
                <div className="logo-ring">
                  <img src={logo} alt="Ngọc Thiện Wedding" />
                </div>
                <strong>NGỌC THIỆN</strong>
                <span>WEDDING</span>
              </div>

              <div className="brand-main">
                <p>Dịch vụ nấu ăn - Dàn nhạc</p>
                <p>Trang trí gia tiên - Sân khấu - Xe hoa</p>
                <h1>NGỌC THIỆN</h1>
                <h2>WEDDING</h2>
                <div className="brand-contact">
                  <span><FaPhoneAlt /> 0366 531 939</span>
                  <span><FaMapMarkerAlt /> Thôn An Tây, Xã Trà Giang, Quảng Ngãi</span>
                </div>
              </div>
            </header>

            <section className="invoice-title">
              <h2>HÓA ĐƠN DỊCH VỤ</h2>
              <div className="invoice-meta">
                <span>Mã hóa đơn: <strong>{order.order_code}</strong></span>
                <span>Ngày lập: <strong>{formatDate(order.order_time)}</strong></span>
                <span>Trạng thái: <strong>{order.status}</strong></span>
              </div>
            </section>

            <section className="customer-panel">
              <div className="section-ribbon">THÔNG TIN KHÁCH HÀNG</div>
              <div className="customer-grid">
                <div className="customer-lines">
                  <p><FaUser /><span>Họ và tên</span><strong>{order.customer_name}</strong></p>
                  <p><FaPhoneAlt /><span>Số điện thoại</span><strong>{order.phone || "Chưa cập nhật"}</strong></p>
                  <p><FaHome /><span>Địa chỉ tổ chức tiệc</span><strong>{order.address || "Chưa cập nhật"}</strong></p>
                  <p><FaRegCalendarAlt /><span>Loại tiệc</span><strong>{order.party_type}</strong></p>
                  <p><FaCalendarAlt /><span>Ngày tổ chức</span><strong>{formatDate(order.event_date)}</strong></p>
                </div>
                <div className="couple-watermark" aria-hidden="true">
                  <span>NT</span>
                  <small>Wedding Service</small>
                </div>
              </div>
            </section>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Dịch vụ</th>
                  <th>Số lượng</th>
                  <th>Đơn giá (VNĐ)</th>
                  <th>Thành tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item, index) => {
                  const quantity = Number(item.quantity || 1);
                  const price = Number(item.product_price || 0);

                  return (
                    <tr key={`${item.product_name}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{item.product_name}</td>
                      <td>{quantity} {item.unit || "gói"}</td>
                      <td>{Number(price).toLocaleString("vi-VN")}</td>
                      <td>{Number(quantity * price).toLocaleString("vi-VN")}</td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td colSpan="4">TỔNG CỘNG</td>
                  <td>{formatMoney(total)}</td>
                </tr>
              </tbody>
            </table>

            <section className="invoice-bottom">
              <div className="payment-box">
                <div className="section-ribbon compact">HÌNH THỨC THANH TOÁN</div>
                <p className={order.payment_method === "cash" ? "checked" : ""}>
                  <span>{order.payment_method === "cash" && <FaCheck />}</span> Tiền mặt
                </p>
                <p className={order.payment_method === "bank" ? "checked" : ""}>
                  <span>{order.payment_method === "bank" && <FaCheck />}</span> Chuyển khoản
                </p>
                <p>
                  <span /> Thanh toán khác
                </p>
                <small>Trạng thái thanh toán: {order.payment_status === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}</small>
              </div>

              <div className="note-box">
                <div className="section-ribbon compact">GHI CHÚ</div>
                <p>Khách hàng đặt cọc trước 30% để giữ lịch.</p>
                <p>Thanh toán phần còn lại sau khi hoàn thành chương trình.</p>
                <p>Giá đã bao gồm chi phí vận chuyển trong khu vực.</p>
                {order.note && <p>{order.note}</p>}
              </div>
            </section>

            <section className="signatures">
              <div>
                <strong>ĐẠI DIỆN NGỌC THIỆN WEDDING</strong>
                <span>(Ký và ghi rõ họ tên)</span>
                <em>Văn Cao Thiện</em>
                <small>(Chủ cơ sở)</small>
              </div>

              <div className="invoice-stamp">
                <strong>NGỌC THIỆN</strong>
                <span>WEDDING</span>
              </div>

              <div>
                <strong>KHÁCH HÀNG</strong>
                <span>(Ký và ghi rõ họ tên)</span>
                <em>{order.customer_name}</em>
              </div>
            </section>

            <p className="invoice-slogan">Món ngon trọn vị - Hạnh phúc trọn đời</p>

            <div className="invoice-actions">
              <button
                className="btn-back"
                onClick={() =>
                  navigate("/thongbao", {
                    state: {
                      orderNotice: location.state?.orderNotice,
                    },
                  })
                }
              >
                Quay lại
              </button>

              <button className="btn-print" onClick={() => window.print()}>
                In hóa đơn
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HoaDon;
