// src/api/axiosConfig.ts
import axios, { 
  AxiosError, 
 type AxiosResponse, 
  type InternalAxiosRequestConfig 
} from 'axios';
import { clearStoredAuthTokens, getStoredAccessToken, setStoredAccessToken } from '@/utils/authToken';

// Định nghĩa cấu trúc dữ liệu trả về từ API Refresh Token để tránh dùng any
interface RefreshTokenResponse {
  token: string;
}

// Định nghĩa Interface để mở rộng thuộc tính _retry tùy biến cho AxiosRequestConfig
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const BASE_URL = import.meta.env.MODE === 'development' 
    ? 'http://localhost:5001/api' 
    : '/api'; 

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Interceptor request: Cấu hình thêm Header Authorization tự động
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = getStoredAccessToken();
        
        // Debug: In ra trạng thái token trong môi trường phát triển (Development)
        if (import.meta.env.DEV) {
            console.log(`🔐 Request to ${config.url || ''}:`, token ? '✅ Token exists' : '❌ No token');
        }
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error: AxiosError): Promise<never> => Promise.reject(error)
);

// Interceptor response: Tự động bẫy lỗi 401 để kích hoạt cơ chế Refresh Token ngầm
api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (error: AxiosError): Promise<unknown> => {
        // Ép kiểu request gốc về CustomAxiosRequestConfig để nhận diện thuộc tính _retry
        const originalRequest = error.config as CustomAxiosRequestConfig;
        
        // Nếu lỗi 401 (Hết hạn Access Token) và request này chưa từng thực hiện thử lại trước đó
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    // Gọi API refresh token (Truyền Generic Type để nhận diện dữ liệu trả về)
                    const response = await axios.post<RefreshTokenResponse>(`${BASE_URL}/auth/refresh`, {
                        refreshToken
                    });
                    
                    const { token } = response.data;
                    
                    // Lưu trữ Access Token mới vào LocalStorage
                    setStoredAccessToken(token);
                    
                    // Cập nhật token mới vào header cho các request tương lai và request hiện tại
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    
                    // Thực thi lại request bị lỗi ban đầu với token mới vừa được cấp
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                
                // Nếu refresh token cũng hết hạn -> Thực hiện xóa sạch phiên làm việc và ép về trang đăng nhập
                clearStoredAuthTokens();
                delete api.defaults.headers.common['Authorization'];
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
