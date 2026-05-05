import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Trong AuthContext.jsx
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Tận dụng Interceptor đã cài, axios tự động đính token lên
                const res = await api.get('/users/me');
                
                // FIX: Sửa lại điều kiện kiểm tra (Chỉ cần có user là được)
                if (res.data && res.data.user) {
                    setUser(res.data.user); 
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.warn("Chưa đăng nhập hoặc Token hết hạn", error.response?.status);
                setUser(null); 
            } finally {
                setLoading(false);
            }
        };
        
        // LƯU Ý: Phải kiểm tra xem trong localStorage CÓ token không mới gọi API, 
        // để tránh gọi dư thừa báo lỗi đỏ Console.
        if (localStorage.getItem('accessToken') || localStorage.getItem('token')) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const logout = async () => {
        try {
            await api.post('/auth/logout');
            // DỌN DẸP SẠCH SẼ LÚC ĐĂNG XUẤT
            localStorage.removeItem('accessToken');
            localStorage.removeItem('token');
            setUser(null);
            window.location.href = '/signin';
        } catch (error) {
            console.error("Lỗi đăng xuất", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook để các Component khác gọi ra xài cho nhanh
export const useAuth = () => useContext(AuthContext);