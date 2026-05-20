import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hàm login - QUAN TRỌNG: Thêm hàm này
    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;
            
            if (token) {
                // Lưu token với cả 2 key để đảm bảo tương thích
                localStorage.setItem('token', token);
                localStorage.setItem('accessToken', token);
                
                // Set Authorization header ngay lập tức
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                setUser(userData);
                return { success: true, user: userData };
            }
            return { success: false, error: 'Không nhận được token' };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Đăng nhập thất bại' 
            };
        }
    };

    // Fetch user khi có token
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            
            // Kiểm tra token hợp lệ
            if (!token || token === "null" || token === "undefined") {
                setLoading(false);
                return;
            }
            
            try {
                // Đảm bảo axios có token trước khi gọi
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                const res = await api.get('/users/me');
                
                if (res.data && res.data.user) {
                    setUser(res.data.user);
                } else if (res.data && res.data.id) {
                    // Trường hợp API trả về thẳng user object
                    setUser(res.data);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.warn("Fetch user failed:", error.response?.status);
                // Token không hợp lệ - xóa sạch
                localStorage.removeItem('accessToken');
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUser();
    }, []);

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout API error:", error);
        } finally {
            // Luôn xóa token dù API có lỗi
            localStorage.removeItem('accessToken');
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout, login }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);