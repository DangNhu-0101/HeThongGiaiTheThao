import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth(); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await api.post('/auth/login', formData);

      if (res.data) { 
        if (res.data.accessToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
        }
        
        if (res.data.user) {
          setUser(res.data.user);
        }
        
        const userRole = res.data.user?.role;
        if (userRole === 'Organization') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }

    } catch (err) {
      alert(err.response?.data?.message || "HỆ THỐNG: Truy cập bị từ chối. Kiểm tra lại thông tin!");
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
      <div className="auth-card glass-card">
        <div className="mb-6">
          <h2 className="text-neon-cyan mb-1">ĐĂNG NHẬP</h2>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input 
              className="auth-input w-full" 
              type="text" 
              name="username"
              placeholder="Username" 
              required 
              value={formData.username}
              onChange={handleInputChange} 
            />
          </div>

          <div className="relative">
            <input 
              className="auth-input w-full" 
              type="password" 
              name="password"
              placeholder="Mật khẩu" 
              required 
              value={formData.password}
              onChange={handleInputChange} 
            />
          </div>
          
          <button 
            className="auth-button w-full mt-6" 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'CONNECTING...' : 'VÀO HỆ THỐNG'}
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-4">
          <Link to="/register" className="auth-link group">
            Chưa có tài khoản? 
            <span className="text-neon-cyan ml-2 font-bold group-hover:underline">
              ĐĂNG KÝ NGAY
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;