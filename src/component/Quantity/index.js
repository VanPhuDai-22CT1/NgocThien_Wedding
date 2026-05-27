import { memo } from "react";
import "./style.scss";
import { ROUTERS } from "utils/router";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";
import { Link, generatePath } from "react-router-dom";
import { formatter } from "utils/formatter";

const Quantity = ({ hasAddToCart = true }) => {
    return (
        <div className="quantity-container">
            <div className="quantity">
                <samp className="qtybtn"></samp>
                <input type="number" defaultValue={1}/>
                <span className="qtybtn">+</span>

            </div>
                {hasAddToCart &&(
                    <button type="submit" className="button-submit">
                        Thêm Vào giỏ hàng
                    </button>
                )}
        </div>
    );
};

export default memo(Quantity);
