import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { FaRobot, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuthItem } from "utils/authStorage";
import { getImageUrl } from "utils/image";
import "./style.scss";

const API = `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/legacy`;
const CHAT_SESSION_KEY_PREFIX = "wedding_live_chat_session";

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const ChatBot = () => {
  const navigate = useNavigate();

  const [open,setOpen] = useState(false);
  const [input,setInput] = useState("");
  const [typing,setTyping] = useState(false);
  const [humanMode, setHumanMode] = useState(false);
  const [chatSession, setChatSession] = useState("");

  const chatRef = useRef(null);

  const [messages,setMessages] = useState([
    {
      from:"bot",
      text:"👋 Xin chào! Tôi là Wedding AI. Hãy cho tôi biết điều bạn muốn tìm! 💕"
    }
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
    if (currentUserId) {
      return `live_user_${currentUserId}`;
    }

    const existed = window.localStorage.getItem(storageSessionKey);
    if (existed) return existed;

    const nextSession = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(storageSessionKey, nextSession);
    return nextSession;
  }, [currentUserId, storageSessionKey]);

  const appendSystemMessage = (text) => {
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
      const nextMessages = rows.map((item) => {
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
              ? [
                  {
                    id: payloadData.id || item.id,
                    name: payloadData.name || "Dịch vụ",
                    price: Number(payloadData.price || 0),
                    cover: payloadData.cover || "",
                  },
                ]
              : undefined,
        };
      });

      if (nextMessages.length === 0) {
        setMessages([
          { from: "bot", text: "👩‍💼 Bạn đang ở chế độ liên hệ nhân viên. Hãy để lại tin nhắn, nhân viên sẽ phản hồi sớm nhất." },
        ]);
        return;
      }

      setMessages(nextMessages);
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
      appendSystemMessage("⚠️ Không thể gửi tin nhắn cho nhân viên, vui lòng thử lại.");
    }
  };

  const suggestions = [
    "🌟 Sản phẩm nổi bật",
    "💍 Tiệc sang trọng",
    "🌳 Tiệc ngoài trời",
    "💰 Tính giá tiệc",
    "📅 Đặt lịch tư vấn",
    "👩‍💼 Liên hệ nhân viên"
  ];

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

  // scroll xuống cuối chat
  useEffect(()=>{
    if(chatRef.current){
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  },[messages,typing]);

  // =========================
  // GỬI TIN NHẮN
  // =========================

  const sendMessage = async (msgText = input) => {

    if(!msgText.trim()) return;

    if (humanMode) {
      await sendLiveMessage(msgText);
      return;
    }

    const userMsg = {from:"user",text:msgText};
    setMessages(prev=>[...prev,userMsg]);

    setTyping(true);

    const text = msgText.toLowerCase();
    const storedUsername = getAuthItem("username") || "";
    const storedEmail = getAuthItem("email") || "";
    const customerEmail = isValidEmail(storedEmail)
      ? storedEmail.trim()
      : (isValidEmail(storedUsername) ? storedUsername.trim() : "");
    const customerName = (storedUsername || "Khách").trim() || "Khách";

    // lưu chat
    try{
      await axios.post(`${API}?action=saveChatbotMessage`,{
        name: customerName,
        email: customerEmail,
        message:msgText
      });
    }catch{}

    // Quick NLU for email/phone/contact
    const analyzeIntent = (s='') => {
      const t = String(s||'').toLowerCase();
      if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return { intent: 'email' };
      if(/^[0-9]{9,11}$/.test(t)) return { intent: 'phone' };
      if(/\b(liên hệ|nhân viên|hỗ trợ|support|liênlac|contact)\b/.test(t)) return { intent: 'contact' };
      return { intent: 'unknown' };
    };

    const quick = analyzeIntent(msgText.trim());
    if(quick.intent === 'email'){
      try{ await axios.post(`${API}?action=saveChatbotMessage`,{ name: customerName, email: msgText.trim(), message: 'Khach de lai email lien he' }); }catch{}
      reply(`✅ **Đã nhận email của bạn!**\n\n📧 Email: ${msgText.trim()}\n\n📞 Chúng tôi sẽ liên hệ sớm để tư vấn chi tiết.`);
      return;
    }

    if(quick.intent === 'phone'){
      try{ await axios.post(`${API}?action=saveChatbotMessage`,{ name: customerName, email: customerEmail, phone: msgText.trim(), message: 'Khach de lai so dien thoai' }); }catch{}
      reply(`✅ **Cảm ơn bạn đã tin tưởng chúng tôi!**\n\n📱 Số điện thoại: ${msgText}\n\n📞 Chúng tôi sẽ **gọi tư vấn ngay**!\n⏱️ Vui lòng chờ trong vòng 30 phút - 2 giờ\n\n💝 Đặc biệt: Khách hàng liên hệ qua chat sẽ được **ưu đãi 5-10%**!`);
      return;
    }

    if(quick.intent === 'contact'){
      setHumanMode(true);
      const session = chatSession || getOrCreateChatSession();
      setChatSession(session);
      appendSystemMessage("👩‍💼 Đã chuyển sang chế độ liên hệ nhân viên. Bạn nhắn nội dung, nhân viên sẽ phản hồi ngay trong khung chat này.");
      await sendLiveMessage(msgText);
      return;
    }

    // Intent mapping (more professional responses)
    const detect = (s='') => {
      const t = String(s||'').toLowerCase();
      if(/\b(sản phẩm|nổi bật|product)\b/.test(t)) return 'products';
      if(/\b(sang trọng|luxury|sang)\b/.test(t)) return 'luxury';
      if(/\b(ngo(?:[àa]i trời|ai troi|ngoài trời)|outdoor)\b/.test(t)) return 'outdoor';
      if(/\b(tính giá|giá|bao nhiêu|báo giá)\b/.test(t)) return 'price';
      if(/\b(đặt lịch|tư vấn|booking|consultation)\b/.test(t)) return 'booking';
      return 'unknown';
    };

    const intent = detect(msgText);

    switch(intent){
      case 'products':
        try{
          const res = await axios.get(`${API}?action=getProducts`);
          if(res.data.success){
            const products = res.data.data.slice(0,3);
            setTimeout(()=>{ setMessages(prev=>[...prev,{ from: 'bot', text: '✨ Dưới đây là một số dịch vụ nổi bật của chúng tôi:', products }]); setTyping(false); },700);
            setInput('');
            return;
          }
        }catch{}
        reply('Xin lỗi, hiện không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
        return;

      case 'luxury':
        reply(`💎 Gói Tiệc Cưới Sang Trọng — Mô tả chuyên nghiệp:\n\n• Trang trí cao cấp, hoa nhập khẩu\n• DJ & MC chuyên nghiệp\n• Chụp ảnh quay phim 4K\n• Catering phong cách 5 sao\n\n💰 Giá tham khảo: 45.000.000 - 60.000.000 VNĐ\n\nĐể nhận tư vấn chi tiết, bạn có muốn để lại số điện thoại hoặc yêu cầu liên hệ không?`);
        return;

      case 'outdoor':
        reply(`🌳 Gói Tiệc Ngoài Trời — Phù hợp cho các cặp ưa thiên nhiên:\n\n• Không gian mở, trang trí nhẹ nhàng\n• Hệ thống đèn, sân khấu di động\n• Catering lưu động chuyên nghiệp\n\n📌 Giá tham khảo: 30.000.000 - 45.000.000 VNĐ\n\nBạn muốn tôi gửi portfolio các sự kiện ngoài trời gần nhất?`);
        return;

      case 'price':{
        const guestCount = msgText.match(/\d{2,4}/)?.[0] || null;
        if(!guestCount){ reply('Bạn dự kiến bao nhiêu khách tham dự? Vui lòng nhập số người (ví dụ: 120).'); return; }
        const pricePerGuest = 150000 + Math.random()*100000;
        const totalPrice = guestCount * pricePerGuest;
        reply(`💰 Dự toán chi phí:\n\n• Số khách: ~${guestCount}\n• Giá/khách: ${Math.round(pricePerGuest).toLocaleString()} VNĐ\n\n**Tổng: ${Math.round(totalPrice).toLocaleString()} VNĐ**\n\nLưu ý: Đây là ước tính nhanh. Để có báo giá chính xác, vui lòng đặt lịch tư vấn.`);
        return;
      }

      case 'booking':
        reply('📅 Để đặt lịch tư vấn, vui lòng cung cấp số điện thoại hoặc chọn "Liên hệ nhân viên" để chúng tôi gọi lại bạn.');
        return;

      default:
        reply("💭 Tôi không hiểu rõ. Bạn muốn hỏi gì? 😊\n\n🔍 Tôi có thể giúp:\n✨ Sản phẩm\n💍 Tiệc sang\n🌳 Tiệc ngoài\n💰 Tính giá\n📅 Đặt lịch");
        return;
    }
  };

  // =========================
  // BOT TRẢ LỜI
  // =========================

  const reply = (text)=>{

    setTimeout(()=>{

      setMessages(prev=>[
        ...prev,
        {from:"bot",text}
      ]);

      setTyping(false);

    },900);

    setInput("");
  };

  // enter gửi tin nhắn
  const handleKey = (e)=>{
    if(e.key==="Enter"){
      sendMessage();
    }
  };

  return(

    <div className="chatbot">

      <div
        className="chatbot-toggle"
        onClick={()=>setOpen(!open)}
      >
        💬
      </div>

      {open && (

        <div className="chatbot-box">

          <div className="chatbot-header">
            <FaRobot/> Wedding AI
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
                  if (!messages.length) {
                    appendSystemMessage("👩‍💼 Bạn đang ở chế độ liên hệ nhân viên.");
                  }
                } else {
                  setMessages([
                    {
                      from: "bot",
                      text: "👋 Xin chào! Tôi là Wedding AI. Hãy cho tôi biết điều bạn muốn tìm! 💕"
                    }
                  ]);
                }
              }}
            >
              {humanMode ? "Đang liên hệ nhân viên" : "Liên hệ nhân viên"}
            </button>
          </div>

          {/* CHAT */}

          <div className="chatbot-messages" ref={chatRef}>

            {messages.map((m,i)=>(

              <div key={m.id || i} className={m.from === "bot" ? "bot" : m.from === "admin" ? "admin" : "user"}>

                <div className="text">{m.text}</div>

                {/* CARD SẢN PHẨM */}

                {m.products && (

                  <div className="bubble-product-list">

                    {m.products.map(p=>(

                      <div
                        key={p.id}
                        className="bubble-product-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => goToProductDetail(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            goToProductDetail(p.id);
                          }
                        }}
                      >

                        <img
                          src={getImageUrl(p.cover)}
                          alt={p.name}
                          onError={(e)=>{
                            e.target.src="https://via.placeholder.com/150";
                          }}
                        />

                        <div className="bubble-product-meta">
                          <strong>{p.name}</strong>
                          <span>{Number(p.price).toLocaleString()} VND</span>
                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            ))}

            {typing && !humanMode && (
              <div className="bot typing">
                Wedding AI đang trả lời...
              </div>
            )}

          </div>

          {/* SUGGESTIONS */}

          <div className="chatbot-suggestions">

            {!humanMode && suggestions.map((s,i)=>(
              <button
                key={i}
                onClick={()=>sendMessage(s)}
              >
                {s}
              </button>
            ))}

          </div>

          {/* INPUT */}

          <div className="chatbot-input">

            <input
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={humanMode ? "Nhắn cho nhân viên..." : "Nhập tin nhắn..."}
            />

            <button onClick={()=>sendMessage()}>
              <FaPaperPlane/>
            </button>

          </div>

        </div>

      )}

    </div>
  );
};

export default ChatBot;