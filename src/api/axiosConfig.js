import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    withCredentials: true, // Vẫn giữ nguyên để gửi Cookie chứa Refresh Token
});

// INTERCEPTOR: Tự động đính kèm Access Token vào mọi Request gửi đi
api.interceptors.request.use(
    (config) => {
        // 1. Lấy token mà bạn đã lưu lúc Login (Hãy đảm bảo tên key 'token' hoặc 'accessToken' khớp với code của bạn)
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        
        // 2. Nếu có token, nhét ngay vào Header
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;