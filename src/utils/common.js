import feature1Imp from "assets/users/images/featured/01.jpg";
import feature2Imp from "assets/users/images/featured/02.jpg";
import feature3Imp from "assets/users/images/featured/03.jpg";
import feature4Imp from "assets/users/images/featured/04.jpg";
import feature5Imp from "assets/users/images/featured/05.jpg";
import feature6Imp from "assets/users/images/featured/06.jpg";
import feature7Imp from "assets/users/images/featured/07.jpg";
import feature8Imp from "assets/users/images/featured/08.jpg";


export const featProducts = {
    all: {
        title: "Toàn Bộ",
        products: [
            { img: feature1Imp, name: "Thịt bò nạt", price: 20000 },
            { img: feature2Imp, name: "chuối lá", price: 15000 },
            { img: feature3Imp, name: "Ổi", price: 12000 },
            { img: feature4Imp, name: "Dưa Hấu", price: 19000 },
            { img: feature5Imp, name: "Nho xanh", price: 200000 },
            { img: feature6Imp, name: "Gà KFC", price: 35000 },
            { img: feature7Imp, name: "Xoài", price: 24000 },
            { img: feature8Imp, name: "Táo ", price: 40000 },
        ],
    },
    freshMeat: {
        title: "Thịt Tươi",
        products: [{ img: feature1Imp, name: "Thịt bò nạt", price: 20000 }],
    },
    fruits: {
        title: "Trái cây ",
        products: [
            { img: feature2Imp, name: "chuối lá", price: 15000 },
            { img: feature3Imp, name: "Ổi", price: 12000 },
            { img: feature4Imp, name: "Dưa Hấu", price: 19000 },
            { img: feature5Imp, name: "Nho xanh", price: 200000 },
            { img: feature7Imp, name: "Xoài", price: 24000 },
            { img: feature8Imp, name: "Táo ", price: 40000 },
        ],
    },
    fastFood: {
        title: "Thức ăn nhanh",
        products: [{ img: feature6Imp, name: "Gà KFC", price: 35000 }],
    }
};