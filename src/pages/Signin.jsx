import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext'; // 1. Bổ sung import Hook

const Signin = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // 2. Lấy hàm setUser từ Global State ra để sử dụng
  const { setUser } = useAuth(); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await api.post('/auth/login', formData);

      // FIX: Backend trả về { message, accessToken, user }, không có chữ "success"
      if (res.data) { 
        alert(res.data.message || "Đăng nhập thành công!");
        
        // 1. LƯU TOKEN VÀO LOCAL STORAGE (Rất quan trọng để Interceptor hoạt động)
        if (res.data.accessToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
        }
        
        // 2. Nạp dữ liệu vào Global State ngay lập tức
        // Việc này giúp ProtectedRoute nhận diện được bạn ngay khi chuyển trang
        if (res.data.user) {
          setUser(res.data.user);
        }
        
        // 3. Điều hướng thông minh dựa trên Role
        const userRole = res.data.user?.role;
        if (userRole === 'Organization') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }

    } catch (err) {
      alert(err.response?.data?.message || "Sai thông tin đăng nhập, vui lòng kiểm tra lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>ĐĂNG NHẬP HỆ THỐNG</h2>
        
        <form onSubmit={handleLogin}>
          <input 
            className="auth-input" 
            type="text" 
            name="username"
            placeholder="Tên đăng nhập" 
            required 
            value={formData.username}
            onChange={handleInputChange} 
          />
          <input 
            className="auth-input" 
            type="password" 
            name="password"
            placeholder="Mật khẩu" 
            required 
            value={formData.password}
            onChange={handleInputChange} 
          />
          
          <button 
            className="auth-input text-white bg-[#CEF15F] text-[#133809] font-bold uppercase cursor-pointer transition hover:bg-[#bad94b] disabled:opacity-50" 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'VÀO HỆ THỐNG'}
          </button>
        </form>

        <Link to="/signup" className="auth-link block mt-4 text-center text-[#666] no-underline">
          Chưa có tài khoản? <span className="text-[#287559] font-bold">Tham gia ngay</span>
        </Link>
      </div>
    </div>
  );
};

export default Signin;