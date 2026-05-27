import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthItem } from "utils/authStorage";
import { getGuestCart, removeGuestCartItem } from "utils/guestCart";
import { apiClient, buildAuthHeaders } from "utils/apiClient";
import "./style.scss";
const VAT_RATE = 0.1;

const Cart = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = getAuthItem("user_id");

  /* ================= FETCH CART ================= */
  const fetchCart = useCallback(async () => {
    if (!userId) {
      setCartItems(getGuestCart());
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get("/cart", {
        params: {
          userid: userId,
        },
      });

      console.log("GET CART RESPONSE:", res.data);

      if (res.data && res.data.success) {
        setCartItems(res.data.data || []);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error("Fetch cart error:", err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  /* ================= REMOVE ITEM ================= */
  const handleRemoveItem = async (id) => {
    if (!userId) {
      const nextCart = removeGuestCartItem(id);
      setCartItems(nextCart);
      return;
    }

    try {
      const res = await apiClient.delete(
        `/cart/${id}`,
        { headers: buildAuthHeaders() }
      );

      if (res.data?.success) {
        fetchCart();
      } else {
        alert("Xóa thất bại!");
      }
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  /* ================= TOTAL ================= */
  const { subTotal, vatAmount, grandTotal } = useMemo(() => {
    const sub = cartItems.reduce(
      (sum, item) =>
        sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    const vat = sub * VAT_RATE;

    return {
      subTotal: sub,
      vatAmount: vat,
      grandTotal: sub + vat,
    };
  }, [cartItems]);

  /* ================= RENDER ================= */

  if (loading) return <p className="loading">Đang tải giỏ hàng...</p>;

  return (
    <div className="cart">
      <h2 className="cart-title">Giỏ hàng của bạn</h2>

      {cartItems.length === 0 ? (
        <p className="empty-cart">Giỏ hàng đang trống</p>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Thành tiền</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {cartItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    {Number(item.price).toLocaleString()} VND
                    {Number(item.quantity || 1) > 1 ? ` × ${Number(item.quantity || 1)}` : ""}
                  </td>
                  <td>
                    {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()} VND
                  </td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-footer">
            <div className="cart-summary">
              <div className="row">
                <span>Tạm tính</span>
                <span>{subTotal.toLocaleString()} VND</span>
              </div>

              <div className="row">
                <span>VAT (10%)</span>
                <span>{vatAmount.toLocaleString()} VND</span>
              </div>

              <div className="row total">
                <span>Tổng thanh toán</span>
                <span>{grandTotal.toLocaleString()} VND</span>
              </div>
            </div>

            <div className="cart-actions">
              <button
                className="cart-btn outline"
                onClick={() => navigate("/sanpham")}
              >
                Thêm sản phẩm
              </button>

              <button
                className="cart-btn primary"
               onClick={() =>
                navigate("/dathang", {
                  state: {
                    cartItems,
                  }
                })
              }
              >
                Gửi yêu cầu đặt dịch vụ
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;