
import axios from 'axios';

// 1. Tự động nhận diện URL Backend
const BASE_URL = import.meta.env.MODE === 'development'
    ? 'http://localhost:5001/api'
    : '/api';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Quan trọng để gửi Cookie
});

api.interceptors.request.use(
    (config) => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

        if (token) {
            if (token !== "null" && token !== "undefined") {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Phiên đăng nhập hết hạn!");
        }
        return Promise.reject(error);
    }
);

export default api;