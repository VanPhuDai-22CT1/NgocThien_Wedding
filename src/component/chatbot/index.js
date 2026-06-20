import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { FaRobot, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuthItem } from "utils/authStorage";
import { getImageUrl, getProductImage } from "utils/image";
import "./style.scss";

const API = `${process.env.REACT_APP_API_URL || "/api"}/legacy`;
const CHAT_SESSION_KEY_PREFIX = "wedding_live_chat_session";

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPhoneNumber = (value = "") => /^[0-9+\s.()-]{9,16}$/.test(value.trim());

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const formatMoney = (value) => Number(value || 0).toLocaleString("vi-VN") + " VNĐ";

const SERVICE_KNOWLEDGE = {
  overview:
    "Ngọc Thiện Wedding nhận tổ chức dịch vụ cưới hỏi trọn gói tại Quảng Ngãi và khu vực lân cận: nấu tiệc, dàn nhạc, trang trí gia tiên, trang trí sân khấu, rạp cưới, bàn ghế, xe hoa và hỗ trợ lên kịch bản ngày cưới.",
  address:
    "Địa chỉ: Thôn An Tây, Xã Trà Giang, Quảng Ngãi. Hotline tư vấn: 0366 531 939.",
  process:
    "Quy trình đặt dịch vụ gồm 4 bước: 1. Trao đổi nhu cầu và ngày tổ chức. 2. Tư vấn gói phù hợp theo số bàn/khách. 3. Chốt báo giá và đặt cọc giữ lịch. 4. Chuẩn bị, thi công và bàn giao trong ngày tiệc.",
  deposit:
    "Thông thường khách đặt cọc khoảng 30% để giữ lịch. Phần còn lại thanh toán sau khi hoàn thành chương trình hoặc theo thỏa thuận trong hợp đồng.",
  menu:
    "Dịch vụ nấu tiệc có thể tư vấn theo ngân sách từng bàn. Mâm tiệc thường gồm khai vị, món chính, lẩu hoặc món nước, tráng miệng. Nếu bạn cho biết số bàn và mức giá mong muốn, tôi sẽ ước tính nhanh giúp bạn.",
  decoration:
    "Trang trí gia tiên và sân khấu có thể làm theo phong cách truyền thống, sang trọng đỏ vàng, pastel nhẹ nhàng hoặc hiện đại. Gói thường gồm phông nền, hoa, bàn gallery, cổng hoa, lối đi và ánh sáng tùy nhu cầu.",
  music:
    "Dàn nhạc có thể gồm âm thanh, ánh sáng, ca sĩ/MC, nhạc sống hoặc DJ tùy quy mô tiệc. Gói cơ bản phù hợp tiệc gia đình; gói nâng cao phù hợp sân khấu lớn hoặc ngoài trời.",
  car:
    "Xe hoa có thể trang trí theo tone cưới: đỏ, trắng, hồng pastel hoặc vàng champagne. Bạn nên đặt sớm để giữ xe đẹp và đồng bộ màu hoa với sân khấu/gia tiên.",
  timing:
    "Bạn nên liên hệ trước 2-4 tuần với tiệc nhỏ, và trước 1-2 tháng với tiệc lớn hoặc ngày đẹp để giữ lịch dàn nhạc, rạp và đội thi công.",
};

const QUICK_REPLIES = [
  "Tư vấn gói cưới trọn gói",
  "Báo giá 30 bàn",
  "Trang trí gia tiên gồm gì?",
  "Dàn nhạc và MC",
  "Xe hoa cưới",
  "Đặt lịch tư vấn",
  "Liên hệ nhân viên",
];

const detectIntent = (message = "") => {
  const text = normalizeText(message);

  if (isValidEmail(message)) return "email";
  if (isPhoneNumber(message) && /\d{9,11}/.test(message.replace(/\D/g, ""))) return "phone";
  if (/(nhan vien|tu van vien|goi lai|lien he|hotline|support|gap nguoi)/.test(text)) return "human";
  if (/(dia chi|o dau|cho nao|vi tri|quang ngai)/.test(text)) return "address";
  if (/(dat coc|coc|thanh toan|chuyen khoan|tien mat|hop dong)/.test(text)) return "deposit";
  if (/(quy trinh|dat lich|giu lich|bao lau|chuan bi|hen tu van|lich tu van)/.test(text)) return "process";
  if (/(nau an|nau tiec|mam|thuc don|mon an|ban tiec|so ban|bao nhieu ban|khach)/.test(text)) return "menu";
  if (/(gia|bao gia|chi phi|du toan|tinh tien|tong tien|ngan sach)/.test(text)) return "price";
  if (/(trang tri|gia tien|san khau|cong hoa|rap|ban gallery|hoa tuoi)/.test(text)) return "decoration";
  if (/(dan nhac|am thanh|anh sang|mc|ca si|dj|nhac song)/.test(text)) return "music";
  if (/(xe hoa|xe cuoi|trang tri xe)/.test(text)) return "car";
  if (/(san pham|dich vu|goi cuoi|goi dich vu|noi bat|combo)/.test(text)) return "products";
  if (/(chao|hello|hi|xin chao)/.test(text)) return "greeting";

  return "unknown";
};

const estimatePrice = (message = "") => {
  const text = normalizeText(message);
  const numbers = [...text.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const tableCount = numbers.find((n) => n >= 5 && n <= 300);
  const guestCount = numbers.find((n) => n >= 50 && n <= 3000);

  if (tableCount) {
    const foodLow = tableCount * 2200000;
    const foodHigh = tableCount * 3200000;
    const decoration = 4000000;
    const music = 5000000;
    return `Với khoảng ${tableCount} bàn, chi phí tham khảo:

- Nấu tiệc: ${formatMoney(foodLow)} - ${formatMoney(foodHigh)}
- Trang trí gia tiên/sân khấu cơ bản: từ ${formatMoney(decoration)}
- Dàn nhạc/âm thanh: từ ${formatMoney(music)}

Tổng dự kiến: ${formatMoney(foodLow + decoration + music)} - ${formatMoney(foodHigh + decoration + music)}.
Giá chính xác còn tùy thực đơn, địa điểm, ngày tổ chức và mức trang trí bạn chọn.`;
  }

  if (guestCount) {
    const estimatedTables = Math.ceil(guestCount / 10);
    return `Nếu khoảng ${guestCount} khách, mình ước tính khoảng ${estimatedTables} bàn. Chi phí sẽ phụ thuộc thực đơn từng bàn. Bạn có thể cho mình mức ngân sách mỗi bàn, ví dụ 2.500.000 hoặc 3.000.000 VNĐ/bàn, tôi sẽ tính sát hơn.`;
  }

  return "Bạn cho tôi biết số bàn hoặc số khách dự kiến nhé. Ví dụ: “báo giá 30 bàn” hoặc “tiệc 300 khách”. Tôi sẽ ước tính chi phí nấu tiệc, trang trí, dàn nhạc và xe hoa cho bạn.";
};

const buildAnswer = (intent, message) => {
  switch (intent) {
    case "greeting":
      return `Xin chào, tôi là Wedding AI của Ngọc Thiện Wedding.

Tôi có thể tư vấn nhanh về nấu tiệc, dàn nhạc, trang trí gia tiên, sân khấu, xe hoa, báo giá theo số bàn và quy trình đặt lịch. Bạn đang chuẩn bị tiệc khoảng bao nhiêu bàn?`;
    case "address":
      return SERVICE_KNOWLEDGE.address;
    case "deposit":
      return SERVICE_KNOWLEDGE.deposit;
    case "process":
      return SERVICE_KNOWLEDGE.process;
    case "menu":
      return `${SERVICE_KNOWLEDGE.menu}

Gợi ý nhanh:
- Tiệc gia đình ấm cúng: thực đơn vừa phải, ưu tiên món dễ ăn.
- Tiệc cưới sang trọng: món khai vị, hải sản, lẩu, tráng miệng.
- Tiệc ngoài trời: ưu tiên món dễ phục vụ, giữ nhiệt tốt.`;
    case "price":
      return estimatePrice(message);
    case "decoration":
      return `${SERVICE_KNOWLEDGE.decoration}

Nếu bạn gửi tone màu yêu thích, số lượng bàn và địa điểm tổ chức, tôi có thể gợi ý concept phù hợp hơn.`;
    case "music":
      return `${SERVICE_KNOWLEDGE.music}

Để chọn gói phù hợp, bạn cho tôi biết tiệc trong nhà hay ngoài trời, số khách và có cần MC/ca sĩ không nhé.`;
    case "car":
      return `${SERVICE_KNOWLEDGE.car}

Bạn muốn xe hoa tone đỏ truyền thống, trắng tinh tế hay pastel nhẹ nhàng?`;
    case "products":
      return SERVICE_KNOWLEDGE.overview;
    default:
      return `Tôi có thể hỗ trợ các câu hỏi về:

- Báo giá theo số bàn/số khách
- Nấu tiệc và thực đơn
- Trang trí gia tiên, sân khấu, rạp cưới
- Dàn nhạc, MC, âm thanh ánh sáng
- Xe hoa và lịch đặt dịch vụ
- Đặt cọc, thanh toán, quy trình hợp đồng

Bạn có thể hỏi ví dụ: “tiệc 30 bàn giá bao nhiêu?”, “trang trí gia tiên gồm gì?”, hoặc “cần đặt trước bao lâu?”.`;
  }
};

const ChatBot = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [humanMode, setHumanMode] = useState(false);
  const [chatSession, setChatSession] = useState("");
  const chatRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Xin chào! Tôi là Wedding AI của Ngọc Thiện Wedding. Bạn cần tư vấn nấu tiệc, trang trí, dàn nhạc, xe hoa hay báo giá theo số bàn?",
    },
  ]);

  const currentUserId = String(getAuthItem("user_id") || "").trim();
  const currentUsername = String(getAuthItem("username") || "").trim();
  const currentEmail = String(getAuthItem("email") || "").trim();

  const accountScopeKey = currentUserId
    ? `user_${currentUserId}`
    : currentEmail
      ? `guest_${currentEmail.toLowerCase()}`
      : currentUsername
        ? `guest_${currentUsername.toLowerCase()}`
        : "guest_anonymous";

  const storageSessionKey = `${CHAT_SESSION_KEY_PREFIX}_${accountScopeKey}`;

  const getOrCreateChatSession = useCallback(() => {
    if (currentUserId) return `live_user_${currentUserId}`;

    const existed = window.localStorage.getItem(storageSessionKey);
    if (existed) return existed;

    const nextSession = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(storageSessionKey, nextSession);
    return nextSession;
  }, [currentUserId, storageSessionKey]);

  const appendBotMessage = (text) => {
    setMessages((prev) => [...prev, { from: "bot", text }]);
  };

  const goToProductDetail = (productId) => {
    if (!productId) return;
    navigate(`/chitietsanpham/${productId}`);
    setOpen(false);
  };

  const loadLiveMessages = useCallback(async (forceSession) => {
    const activeSession = forceSession || chatSession || getOrCreateChatSession();
    if (!activeSession) return;

    try {
      const res = await axios.get(`${API}?action=getLiveChatMessages&chat_session=${encodeURIComponent(activeSession)}&_=${Date.now()}`);
      if (!res.data?.success) return;

      const rows = Array.isArray(res.data.data) ? res.data.data : [];
      if (rows.length === 0) {
        setMessages([
          {
            from: "bot",
            text: "Bạn đang ở chế độ liên hệ nhân viên. Hãy để lại câu hỏi, nhân viên sẽ phản hồi trong khung chat này.",
          },
        ]);
        return;
      }

      setMessages(rows.map((item) => {
        let payloadData = null;
        if (item.payload_json) {
          try {
            payloadData = JSON.parse(item.payload_json);
          } catch {
            payloadData = null;
          }
        }

        return {
          id: item.id,
          from: item.sender === "admin" ? "admin" : "user",
          text: item.message || "",
          products:
            item.message_type === "product" && payloadData
              ? [{
                  id: payloadData.id || item.id,
                  name: payloadData.name || "Dịch vụ",
                  price: Number(payloadData.price || 0),
                  cover: getProductImage(payloadData),
                }]
              : undefined,
        };
      }));
    } catch (error) {
      console.error("Load live chat messages error:", error);
    }
  }, [chatSession, getOrCreateChatSession]);

  const sendLiveMessage = async (msgText = input) => {
    const textValue = String(msgText || "").trim();
    if (!textValue) return;

    const session = chatSession || getOrCreateChatSession();
    const userId = Number(getAuthItem("user_id") || 0);
    const username = getAuthItem("username") || "Khách hàng";
    const email = getAuthItem("email") || "";

    setMessages((prev) => [...prev, { from: "user", text: textValue }]);
    setInput("");

    try {
      const res = await axios.post(
        `${API}?action=sendLiveChatMessage`,
        {
          chat_session: session,
          user_id: userId,
          customer_name: username,
          customer_email: isValidEmail(email) ? email : "",
          sender: "customer",
          message: textValue,
          message_type: "text",
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.success) {
        const nextSession = res.data.chat_session || session;
        setChatSession(nextSession);
        if (!currentUserId) {
          window.localStorage.setItem(storageSessionKey, nextSession);
        }
      }
    } catch (error) {
      console.error("Send live chat error:", error);
      appendBotMessage("Không thể gửi tin nhắn cho nhân viên lúc này. Bạn vui lòng thử lại hoặc gọi hotline 0366 531 939.");
    }
  };

  const saveBotMessage = async (message, extra = {}) => {
    const storedUsername = getAuthItem("username") || "";
    const storedEmail = getAuthItem("email") || "";
    const customerEmail = isValidEmail(storedEmail)
      ? storedEmail.trim()
      : (isValidEmail(storedUsername) ? storedUsername.trim() : "");
    const customerName = (storedUsername || "Khách").trim() || "Khách";

    try {
      await axios.post(`${API}?action=saveChatbotMessage`, {
        name: customerName,
        email: customerEmail,
        message,
        ...extra,
      });
    } catch {
      // Chat should continue even if logging fails.
    }
  };

  useEffect(() => {
    const session = getOrCreateChatSession();
    setChatSession(session);
  }, [getOrCreateChatSession, accountScopeKey]);

  useEffect(() => {
    if (!open || !humanMode) return;

    const session = chatSession || getOrCreateChatSession();
    loadLiveMessages(session);

    const timer = setInterval(() => {
      loadLiveMessages(session);
    }, 3000);

    return () => clearInterval(timer);
  }, [open, humanMode, chatSession, getOrCreateChatSession, loadLiveMessages]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const reply = (text) => {
    setTimeout(() => {
      appendBotMessage(text);
      setTyping(false);
    }, 650);
    setInput("");
  };

  const showProducts = async () => {
    try {
      const res = await axios.get(`${API}?action=getProducts`);
      if (res.data?.success) {
        const products = (res.data.data || []).slice(0, 3);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: "Một số dịch vụ nổi bật bạn có thể tham khảo:",
              products,
            },
          ]);
          setTyping(false);
        }, 650);
        return true;
      }
    } catch {
      // Fall back to text answer.
    }

    return false;
  };

  const switchToHuman = async (messageToSend = "") => {
    setHumanMode(true);
    const session = chatSession || getOrCreateChatSession();
    setChatSession(session);
    appendBotMessage("Đã chuyển sang chế độ liên hệ nhân viên. Bạn cứ nhắn nhu cầu, nhân viên Ngọc Thiện Wedding sẽ phản hồi tại đây.");
    if (messageToSend) {
      await sendLiveMessage(messageToSend);
    }
  };

  const sendMessage = async (msgText = input) => {
    const cleanText = String(msgText || "").trim();
    if (!cleanText) return;

    if (humanMode) {
      await sendLiveMessage(cleanText);
      return;
    }

    setMessages((prev) => [...prev, { from: "user", text: cleanText }]);
    setTyping(true);
    setInput("");
    await saveBotMessage(cleanText);

    const intent = detectIntent(cleanText);

    if (intent === "email") {
      await saveBotMessage("Khách để lại email", { email: cleanText });
      reply(`Đã nhận email của bạn: ${cleanText}.

Ngọc Thiện Wedding sẽ liên hệ để tư vấn chi tiết về dịch vụ, ngày tiệc và báo giá phù hợp.`);
      return;
    }

    if (intent === "phone") {
      await saveBotMessage("Khách để lại số điện thoại", { phone: cleanText });
      reply(`Cảm ơn bạn. Tôi đã ghi nhận số điện thoại: ${cleanText}.

Nhân viên sẽ liên hệ tư vấn về dịch vụ cưới hỏi, báo giá và lịch tổ chức. Hotline cần gọi nhanh: 0366 531 939.`);
      return;
    }

    if (intent === "human") {
      setTyping(false);
      await switchToHuman(cleanText);
      return;
    }

    if (intent === "products") {
      const loaded = await showProducts();
      if (loaded) return;
    }

    reply(buildAnswer(intent, cleanText));
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="chatbot">
      <button
        type="button"
        className="chatbot-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Mở Wedding AI"
      >
        <FaRobot />
      </button>

      {open && (
        <div className="chatbot-box">
          <div className="chatbot-header">
            <div className="chat-title">
              <FaRobot />
              <div>
                <strong>Wedding AI</strong>
                <span>Ngọc Thiện Wedding</span>
              </div>
            </div>
            <button
              type="button"
              className={`chat-mode-btn ${humanMode ? "active" : ""}`}
              onClick={async () => {
                const nextMode = !humanMode;
                setHumanMode(nextMode);

                if (nextMode) {
                  const session = chatSession || getOrCreateChatSession();
                  setChatSession(session);
                  await loadLiveMessages(session);
                } else {
                  setMessages([
                    {
                      from: "bot",
                      text: "Tôi đã quay lại chế độ Wedding AI. Bạn muốn hỏi về báo giá, thực đơn, trang trí, dàn nhạc hay xe hoa?",
                    },
                  ]);
                }
              }}
            >
              {humanMode ? "AI tự động" : "Nhân viên"}
            </button>
          </div>

          <div className="chatbot-messages" ref={chatRef}>
            {messages.map((message, index) => (
              <div key={message.id || index} className={message.from === "bot" ? "bot" : message.from === "admin" ? "admin" : "user"}>
                <div className="text">{message.text}</div>

                {message.products && (
                  <div className="bubble-product-list">
                    {message.products.map((product) => (
                      <div
                        key={product.id}
                        className="bubble-product-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => goToProductDetail(product.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            goToProductDetail(product.id);
                          }
                        }}
                      >
                        <img
                          src={getImageUrl(getProductImage(product))}
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/150";
                          }}
                        />
                        <div className="bubble-product-meta">
                          <strong>{product.name}</strong>
                          <span>{formatMoney(product.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {typing && !humanMode && (
              <div className="bot typing">
                Wedding AI đang soạn câu trả lời...
              </div>
            )}
          </div>

          {!humanMode && (
            <div className="chatbot-suggestions">
              {QUICK_REPLIES.map((suggestion) => (
                <button key={suggestion} onClick={() => sendMessage(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="chatbot-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={humanMode ? "Nhắn cho nhân viên..." : "Hỏi về dịch vụ cưới hỏi..."}
            />

            <button type="button" onClick={() => sendMessage()} aria-label="Gửi tin nhắn">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
