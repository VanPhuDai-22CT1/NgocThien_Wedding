import { memo, useState } from "react";
import "./style.scss";
import { useNavigate } from "react-router-dom";
import {
  FaFacebookF,
  FaYoutube,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";

const Footer = () => {
    const navigate = useNavigate();
    const [newsletterEmail, setNewsletterEmail] = useState("");

    const handleSubmitNewsletter = (e) => {
        e.preventDefault();
        navigate("/dangky", {
            state: { email: newsletterEmail.trim() },
        });
    };

    return (
        <footer className="footer">
            <div className="container">
                <div className="row">
                    {/* Footer About */}
                    <div className="col-lg-3 col-md-6 col-xm-6 col-xs-12">
                        <div className="footer__about">
                        <ul>
                            <li>Địa chỉ: Quảng Ngãi</li>
                            <li>Phone: 0367234139</li>
                            <li>Email: Dai_2251220039@dau.edu.vn</li>
                        </ul>

                        {/* SOCIAL ICONS */}
                       <div className="footer__social">
                        <a
                            href="https://www.facebook.com/ngoc.thien.476318"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="fb"
                        >
                            <FaFacebookF />
                        </a>

                        <a
                            href="https://www.youtube.com/watch?v=ZtHsc3PwZ9Q"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="yt"
                        >
                            <FaYoutube />
                        </a>

                        <a
                            href="https://www.instagram.com/ngocthien"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ig"
                        >
                            <FaInstagram />
                        </a>

                        <a
                            href="https://www.tiktok.com/@lehuudanh6/video/7596772008327728405?is_from_webapp=1&sender_device=pc&web_id=7344372368226076161"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tt"
                        >
                            <FaTiktok />
                        </a>
                        </div>

                        </div>

                    </div>

                    {/* Footer Widget */}
                    <div className="col-lg-6 col-md-6 col-xs-12">
                        <div className="footer__widget">
                            <ul>
                                <li>Dịch Vụ: Nấu Ăn Ngọc Thiện</li>
                                <li>Liên Hệ: 0367234139</li>
                                <li>Thông Tin Về Dịch Vụ</li>
                                <li>Sản Phẩm Và Dịch Vụ</li>
                            </ul>
                            <ul>
                                <li>Thông Tin Và Dịch Vụ</li>
                                <li>Giỏ Hàng</li>
                                <li>Dịch Vụ Yêu Thích </li>
                                <li>Đăng Ký</li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer Subscription & Logout */}
                    <div className="col-lg-3 col-md-12 col-xm-12 col-xs-12">
                        <div className="footer__widget">
                            <h6>Khuyến Mãi & Ưu Đãi</h6>
                            <h6>Đăng ký thông tin tại đây</h6>
                            <form onSubmit={handleSubmitNewsletter}>
                                <div className="input-group input-group-nested">
                                    <input
                                        type="email"
                                        placeholder="Nhập email để nhận ưu đãi"
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="button-submit">
                                        Đăng ký
                                    </button>
                                </div>
                            </form>
                            
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default memo(Footer);
