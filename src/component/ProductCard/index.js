import { memo, useEffect, useState } from "react";
import "./style.scss";
import { ROUTERS } from "utils/router";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";
import { Link, generatePath } from "react-router-dom";
import { formatter } from "utils/formatter";

const ProductCard = ({ img, name, price, productId, onAddToCart }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleAddToCartClick = () => {
        if (onAddToCart) {
            onAddToCart({ id: productId, img, name, price, quantity: 1 }); // Truyền thông tin sản phẩm
        }
    };

    const handleViewDetailClick = () => {
        const detailPath = generatePath(ROUTERS.USER.PRODUCT_DETAIL, { id: productId });
        window.location.href = detailPath;
    };

    return (
        <div
            className="featured__item pl-pr-10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="featured__item__pic"
                style={{
                    backgroundImage: `url(${img})`,
                }}
            >
                <ul
                    className="featured__item__pic__hover"
                    style={{
                        top: isHovered ? "80%" : "120%",
                        opacity: isHovered ? 1 : 0,
                        transition: "top 0.5s ease-in-out, opacity 0.5s ease-in-out",
                    }}
                >
                    <li onClick={handleViewDetailClick}>
                        <AiOutlineEye />
                    </li>
                    <li onClick={handleAddToCartClick}>
                        <AiOutlineShoppingCart />
                    </li>
                </ul>
            </div>
            <div className="featured__item__text">
                <h6>
                    <Link to={generatePath(ROUTERS.USER.PRODUCT_DETAIL, { id: productId })}>
                        {name}
                    </Link>
                </h6>
                <h5>{formatter ? formatter(price) : price.toLocaleString()} </h5>
            </div>
        </div>
    );
};

export default memo(ProductCard);

