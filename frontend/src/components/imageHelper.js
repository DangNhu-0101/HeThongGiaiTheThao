// src/utils/imageHelper.js

// Tự động nhận diện link theo môi trường (Dev hay Production)
const SERVER_URL = import.meta.env.MODE === 'production' 
    ? window.location.origin + '/' 
    : 'http://localhost:5001/';

/**
 * Hàm xử lý đường dẫn ảnh dùng chung cho toàn bộ dự án
 * @param {string} path - Đường dẫn lưu trong DB (ví dụ: uploads\tour-123.jpg)
 * @returns {string} - URL hoàn chỉnh để hiển thị trên trình duyệt
 */
export const getImg = (path) => {
    if (!path) return "https://via.placeholder.com/800x400?text=IMAGE+NOT+FOUND";
    
    // Fix lỗi dấu gạch chéo ngược của Windows
    const cleanPath = path.replace(/\\/g, '/'); 
    
    return `${SERVER_URL}${cleanPath}`;
};