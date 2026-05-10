import axios from 'axios';

// 1. Tự động nhận diện URL Backend
const BASE_URL = import.meta.env.MODE === 'development' 
    ? 'http://localhost:5001/api' 
    : '/api'; 

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Quan trọng để gửi Cookie
});

// INTERCEPTOR: Chốt chặn gửi đi
api.interceptors.request.use(
    (config) => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        
        if (token) {
            // Kiểm tra tránh trường hợp token bị lưu thành chuỗi "null" hoặc "undefined"
            if (token !== "null" && token !== "undefined") {
                // Sử dụng config.headers.Authorization (viết hoa chữ A cho chuẩn Standard)
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        
        // Log nhẹ để Như kiểm tra lúc debug (Xóa khi chạy thật)
        // console.log("Header gửi đi:", config.headers.Authorization);
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// MỚI: Thêm Interceptor cho phản hồi (Response) để xử lý khi Token hết hạn
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Nếu Server trả về 401 (Unauthorized) nghĩa là Token "oẳng" rồi
        if (error.response && error.response.status === 401) {
            console.warn("Phiên đăng nhập hết hạn!");
            // localStorage.removeItem('token'); 
            // window.location.href = '/login'; // Có thể đá ra trang login nếu cần
        }
        return Promise.reject(error);
    }
);

export default api;