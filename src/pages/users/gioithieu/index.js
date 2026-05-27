import React, { memo } from "react";
import "./style.scss";

const NgocThienWedding = () => {
  return (
    <div className="container wedding-ec">
      <header className="wedding-ec__header">
        <h1>Ngọc Thiện Wedding</h1>
        <p>
          Nền tảng dịch vụ cưới hỏi trọn gói kết hợp thương mại điện tử hiện đại,
          giúp bạn chuẩn bị ngày trọng đại một cách dễ dàng và trọn vẹn.
        </p>
      </header>

      <section className="card">
        <h2>Tổng quan</h2>
        <p>
          Ngọc Thiện Wedding chuyên cung cấp dịch vụ cưới hỏi trọn gói cùng hệ
          thống thương mại điện tử, cho phép khách hàng lựa chọn dịch vụ, đặt
          lịch và mua sắm sản phẩm cưới nhanh chóng chỉ trong vài bước.
        </p>
      </section>

      <section className="card">
        <h2>Sứ mệnh</h2>
        <ul>
          <li>Mang đến trải nghiệm cưới hỏi tinh tế – tiết kiệm – trọn vẹn.</li>
          <li>Số hóa dịch vụ cưới hỏi bằng nền tảng thương mại điện tử.</li>
          <li>Đồng hành cùng các cặp đôi trong khoảnh khắc quan trọng nhất.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Sản phẩm & dịch vụ</h2>

        <div className="sub-section">
          <h3>Dịch vụ cưới hỏi</h3>
          <ul>
            <li>Trang trí lễ gia tiên, tiệc cưới, backdrop, cổng hoa.</li>
            <li>Cho thuê áo cưới, áo dài, vest.</li>
            <li>Makeup cô dâu, chụp ảnh cưới, quay phim sự kiện.</li>
          </ul>
        </div>

        <div className="sub-section">
          <h3>Sản phẩm cưới</h3>
          <ul>
            <li>Tráp cưới, mâm quả, phụ kiện cưới.</li>
            <li>Thiệp cưới, quà cưới, quà tặng khách mời.</li>
          </ul>
        </div>

        <div className="sub-section">
          <h3>Thương mại điện tử</h3>
          <ul>
            <li>Đặt dịch vụ cưới hỏi online nhanh chóng.</li>
            <li>Giỏ hàng & thanh toán trực tuyến an toàn.</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h2>Cam kết</h2>
        <ul className="commitment">
          <li>
            <strong>Chất lượng:</strong> Dịch vụ chỉn chu, sản phẩm đúng mô tả.
          </li>
          <li>
            <strong>Minh bạch:</strong> Giá cả rõ ràng, hợp đồng đầy đủ.
          </li>
          <li>
            <strong>Đúng hẹn:</strong> Đảm bảo tiến độ cho ngày trọng đại.
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>Dịch vụ nổi bật</h2>
        <ul>
          <li>Tư vấn cưới hỏi 1–1 theo ngân sách & phong cách riêng.</li>
          <li>Đặt dịch vụ online nhanh gọn qua website.</li>
          <li>Giao sản phẩm tận nơi an toàn – đúng hẹn.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Khách hàng mục tiêu</h2>
        <ul>
          <li>Các cặp đôi chuẩn bị tổ chức lễ cưới.</li>
          <li>Gia đình cần dịch vụ cưới hỏi trọn gói.</li>
          <li>Khách hàng mua sắm sản phẩm cưới online.</li>
        </ul>
      </section>

      <section className="card highlight">
        <h2>Giá trị khác biệt</h2>
        <ul>
          <li>Kết hợp dịch vụ cưới hỏi & TMĐT trong một nền tảng.</li>
          <li>Giao diện hiện đại, thân thiện trên mọi thiết bị.</li>
          <li>Đội ngũ hỗ trợ nhanh – linh hoạt – chuyên nghiệp.</li>
        </ul>
      </section>

      <section className="card conclusion">
        <h2>Lời kết</h2>
        <p>
          Ngọc Thiện Wedding không chỉ là đơn vị tổ chức cưới hỏi, mà còn là
          người bạn đồng hành giúp bạn chuẩn bị cho ngày trọng đại một cách
          nhẹ nhàng, trọn vẹn và đầy cảm xúc.
        </p>
      </section>
    </div>
  );
};

export default memo(NgocThienWedding);
