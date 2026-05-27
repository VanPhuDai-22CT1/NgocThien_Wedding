const API = "http://localhost:4000";

export const getImageUrl = (img) => {
  if (!img) {
    return "https://via.placeholder.com/300x300?text=No+Image";
  }

  // Nếu backend trả full URL
  if (img.startsWith("http")) {
    return img;
  }

  // Loại bỏ đường dẫn dư (phòng trường hợp lưu cả uploads/abc.jpg)
  const cleanImg = img.replace(/^uploads\//, "");

  return `${API}/uploads/${cleanImg}`;
};

