import React, { useEffect, useMemo, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthItem } from "utils/authStorage";
import { getImageUrl } from "utils/image";
import {
  FaArrowLeft,
  FaBell,
  FaBox,
  FaChartPie,
  FaComments,
  FaHistory,
  FaPaperPlane,
  FaRegCalendarAlt,
  FaSearch,
  FaShoppingCart,
  FaUsers,
} from "react-icons/fa";
import "./style.scss";

const API = `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/legacy`;

const normalizeText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function AdminChat() {
  const navigate = useNavigate();
  const role = getAuthItem("role");

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const loadSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await axios.get(`${API}?action=getLiveChatSessions&_=${Date.now()}`);
      const rows = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];
      setSessions(rows);

      if (!selectedSession && rows.length > 0) {
        setSelectedSession(rows[0].chat_session);
      }

      if (selectedSession && !rows.some((item) => item.chat_session === selectedSession)) {
        setSelectedSession(rows[0]?.chat_session || "");
      }
    } catch (error) {
      console.error("Load live sessions error:", error);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [selectedSession]);

  const loadMessages = useCallback(async (sessionId) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    try {
      setLoadingMessages(true);
      const res = await axios.get(
        `${API}?action=getLiveChatMessages&chat_session=${encodeURIComponent(sessionId)}&_=${Date.now()}`
      );

      if (res.data?.success) {
        setMessages(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setMessages([]);
      }

      await axios.post(
        `${API}?action=markLiveChatRead`,
        { chat_session: sessionId },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Load live messages error:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}?action=getProducts&_=${Date.now()}`);
      const rows = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];
      setProducts(rows);
    } catch (error) {
      console.error("Load products for chat error:", error);
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!selectedSession) return;
    loadMessages(selectedSession);
  }, [selectedSession, loadMessages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadSessions();
      if (selectedSession) {
        loadMessages(selectedSession);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [loadMessages, loadSessions, selectedSession]);

  const filteredSessions = useMemo(() => {
    const key = normalizeText(keyword);
    if (!key) return sessions;

    return sessions.filter((item) => {
      const searchText = normalizeText(
        `${item.chat_session || ""} ${item.customer_name || ""} ${item.customer_email || ""} ${item.latest_message || ""}`
      );
      return searchText.includes(key);
    });
  }, [sessions, keyword]);

  const activeSessionInfo = useMemo(
    () => sessions.find((item) => item.chat_session === selectedSession) || null,
    [sessions, selectedSession]
  );

  const handleSendReply = async () => {
    const content = String(reply || "").trim();
    if (!content || !selectedSession) return;

    try {
      await axios.post(
        `${API}?action=sendLiveChatMessage`,
        {
          chat_session: selectedSession,
          sender: "admin",
          message: content,
          customer_name: activeSessionInfo?.customer_name || "Khách hàng",
          customer_email: activeSessionInfo?.customer_email || "",
        },
        { headers: { "Content-Type": "application/json" } }
      );

      setReply("");
      await loadMessages(selectedSession);
      await loadSessions();
    } catch (error) {
      console.error("Send admin reply error:", error);
      alert("Không thể gửi phản hồi cho khách hàng");
    }
  };

  const handleSendProduct = async () => {
    if (!selectedSession || !selectedProductId) return;

    const selectedProduct = products.find(
      (item) => String(item.id) === String(selectedProductId)
    );

    if (!selectedProduct) {
      alert("Không tìm thấy dịch vụ đã chọn");
      return;
    }

    const payload = {
      id: Number(selectedProduct.id),
      name: selectedProduct.name,
      price: Number(selectedProduct.price || 0),
      cover: selectedProduct.cover || "",
      description: selectedProduct.description || "",
    };

    try {
      await axios.post(
        `${API}?action=sendLiveChatMessage`,
        {
          chat_session: selectedSession,
          sender: "admin",
          message: `🎁 Gợi ý dịch vụ: ${selectedProduct.name}`,
          message_type: "product",
          payload,
          customer_name: activeSessionInfo?.customer_name || "Khách hàng",
          customer_email: activeSessionInfo?.customer_email || "",
        },
        { headers: { "Content-Type": "application/json" } }
      );

      await loadMessages(selectedSession);
      await loadSessions();
      setSelectedProductId("");
    } catch (error) {
      console.error("Send product message error:", error);
      alert("Không thể gửi dịch vụ cho khách hàng");
    }
  };

  return (
    <div className="chat-management-layout">
      <aside className="sidebar">
        <div className="logo">NGỌC THIỆN ADMIN</div>

        <ul>
          <li>
            <NavLink to="/dashboard">
              <FaChartPie /> Tổng quan
            </NavLink>
          </li>

          {role === "admin" && (
            <li>
              <NavLink to="/qlnguoidung">
                <FaUsers /> Người dùng
              </NavLink>
            </li>
          )}

          <li>
            <NavLink to="/qlsanpham">
              <FaBox /> Dịch vụ
            </NavLink>
          </li>

          <li>
            <NavLink to="/qldonhang">
              <FaShoppingCart /> Đơn hàng
            </NavLink>
          </li>

          <li>
            <NavLink to="/qltinnhan">
              <FaComments /> Tin nhắn
            </NavLink>
          </li>
          <li>
            <NavLink to="/notification">
              <FaBell /> Lịch tư vấn
            </NavLink>
          </li>
          <li>
            <NavLink to="/lichlamviec">
              <FaRegCalendarAlt /> Lịch làm việc
            </NavLink>
          </li>
          <li>
            <NavLink to="/qlhoatdong">
              <FaHistory /> Lịch sử hoạt động
            </NavLink>
          </li>

          <li>
            <NavLink to="/thong-ke">
              <FaChartPie /> Thống kê
            </NavLink>
          </li>

          <li>
            <NavLink to="/admin/ho-so-nguoi-code">
              <FaUsers /> Hồ sơ người code
            </NavLink>
          </li>
        </ul>
      </aside>

      <div className="chat-management-content">
        <div className="page-header">
          <h2>Tin nhắn trực tiếp khách hàng</h2>
          <button type="button" className="btn-back" onClick={() => navigate("/dashboard")}>
            <FaArrowLeft /> Quay lại Dashboard
          </button>
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <FaSearch />
            <input
              type="text"
              value={keyword}
              placeholder="Tìm theo tên khách, email hoặc nội dung"
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <button type="button" className="btn-refresh" onClick={loadSessions}>
            Tải lại
          </button>
        </div>

        <div className="chat-main-panel">
          <div className="chat-session-list">
            {loadingSessions ? (
              <div className="empty">Đang tải phiên chat...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="empty">Chưa có tin nhắn từ khách hàng</div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = selectedSession === session.chat_session;

                return (
                  <button
                    key={session.chat_session}
                    type="button"
                    className={`session-item ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedSession(session.chat_session)}
                  >
                    <div className="session-head">
                      <strong>{session.customer_name || "Khách hàng"}</strong>
                      {Number(session.unread_count || 0) > 0 && (
                        <span className="unread">{session.unread_count}</span>
                      )}
                    </div>

                    <div className="session-email">{session.customer_email || session.chat_session}</div>
                    <div className="session-message">{session.latest_message || "(Không có nội dung)"}</div>
                    <div className="session-time">
                      {session.latest_at ? new Date(session.latest_at).toLocaleString("vi-VN") : "-"}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="chat-conversation-panel">
            {!selectedSession ? (
              <div className="empty">Chọn một phiên chat để bắt đầu phản hồi</div>
            ) : (
              <>
                <div className="conversation-head">
                  <div>
                    <strong>{activeSessionInfo?.customer_name || "Khách hàng"}</strong>
                    <p>{activeSessionInfo?.customer_email || selectedSession}</p>
                  </div>
                </div>

                <div className="conversation-messages">
                  {loadingMessages ? (
                    <div className="empty">Đang tải hội thoại...</div>
                  ) : messages.length === 0 ? (
                    <div className="empty">Khách hàng chưa gửi tin nhắn</div>
                  ) : (
                    messages.map((item) => {
                      let payloadData = null;
                      if (item.payload_json) {
                        try {
                          payloadData = JSON.parse(item.payload_json);
                        } catch {
                          payloadData = null;
                        }
                      }

                      return (
                      <div key={item.id} className={`chat-bubble ${item.sender === "admin" ? "admin" : "customer"}`}>
                        <div className="bubble-label">{item.sender === "admin" ? "Nhân viên" : "Khách hàng"}</div>
                        <div className="bubble-text">{item.message}</div>
                        {item.message_type === "product" && payloadData && (
                          <div className="bubble-product-card">
                            <img
                              src={getImageUrl(payloadData.cover)}
                              alt={payloadData.name || "Dịch vụ"}
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/180x120?text=No+Image";
                              }}
                            />
                            <div className="bubble-product-meta">
                              <strong>{payloadData.name || "Dịch vụ"}</strong>
                              <span>{Number(payloadData.price || 0).toLocaleString()} VND</span>
                            </div>
                          </div>
                        )}
                        <div className="bubble-time">
                          {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : ""}
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>

                <div className="conversation-reply">
                  <input
                    type="text"
                    value={reply}
                    placeholder="Nhập phản hồi cho khách hàng..."
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendReply();
                      }
                    }}
                  />
                  <button type="button" onClick={handleSendReply}>
                    <FaPaperPlane /> Gửi
                  </button>
                </div>

                <div className="conversation-product-send">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Chọn dịch vụ để gửi cho khách</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {Number(product.price || 0).toLocaleString()} VND
                      </option>
                    ))}
                  </select>

                  <button type="button" onClick={handleSendProduct} disabled={!selectedProductId}>
                    Gửi dịch vụ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
