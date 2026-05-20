import axios from 'axios';

const BASE_URL = import.meta.env.MODE === 'development' 
    ? 'http://localhost:5001/api' 
    : '/api'; 

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Interceptor request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        
        // Debug: In ra token (chỉ trong development)
        if (import.meta.env.DEV) {
            console.log(`🔐 Request to ${config.url}:`, token ? '✅ Token exists' : '❌ No token');
        }
        
        if (token && token !== "null" && token !== "undefined") {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor response
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Nếu lỗi 401 và chưa thử refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Thử refresh token (nếu có endpoint refresh)
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
                        refreshToken
                    });
                    
                    const { token } = response.data;
                    localStorage.setItem('token', token);
                    localStorage.setItem('accessToken', token);
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                // Refresh thất bại -> logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                delete api.defaults.headers.common['Authorization'];
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;