import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [userForm, setUserForm] = useState({
    username: '', password: '', email: '', displayName: '', phoneNumber: '', role: 'Player'
  });

  const [profileForm, setProfileForm] = useState({
    birthYear: '', gender: 'male', skill: '2.0', experienceYears: '',
    orgName: '', address: '', description: ''
  });

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      // Gửi theo đúng User Schema: phoneNumber
      await api.post('/api/auth/register', { ...userForm });

      const loginRes = await api.post('/api/auth/login', {
        username: userForm.username,
        password: userForm.password
      });

      localStorage.setItem('accessToken', loginRes.data.accessToken);
      const tokenPayload = JSON.parse(atob(loginRes.data.accessToken.split('.')[1]));
      setCurrentUserId(tokenPayload.userId);
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi đăng ký.");
    } finally { setIsSaving(false); }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      let payload = { userId: currentUserId, name: userForm.displayName };

      if (userForm.role === 'Player') {
        payload = { ...payload, skill: Number(profileForm.skill), birthYear: Number(profileForm.birthYear) };
      } else if (userForm.role === 'Referee') {
        payload = { ...payload, phone: userForm.phoneNumber, birthYear: Number(profileForm.birthYear), experienceYears: Number(profileForm.experienceYears) };
      } else if (userForm.role === 'Organization') {
        payload = { 
          ...payload,
          orgName: profileForm.orgName,
          address: profileForm.address,
          description: profileForm.description,
          phone: userForm.phoneNumber, // Lấy từ Bước 1
          contactEmail: userForm.email  // QUAN TRỌNG: Gửi email từ Bước 1 sang
        };
      }

      await api.post('/api/users/completeUser', payload);
      setIsSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi hoàn thiện hồ sơ.");
    } finally { setIsSaving(false); }
  };

  if (isSubmitted) return <div className="auth-container"><h2>Đăng ký thành công!</h2><button onClick={() => navigate('/signin')}>Đăng nhập</button></div>;

  return (
    <div className="auth-container">
      <div className="auth-card">
        {step === 1 ? (
          <form onSubmit={handleStep1Submit}>
            <h2>BƯỚC 1: TÀI KHOẢN</h2>
            <input className="auth-input" placeholder="Tên hiển thị" value={userForm.displayName} onChange={e => setUserForm({...userForm, displayName: e.target.value})} required />
            <input className="auth-input" placeholder="Email" type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
            <input className="auth-input" placeholder="Số điện thoại" value={userForm.phoneNumber} onChange={e => setUserForm({...userForm, phoneNumber: e.target.value})} required />
            <input className="auth-input" placeholder="Tên đăng nhập" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
            <input className="auth-input" type="password" placeholder="Mật khẩu" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />
            <select className="auth-input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
              <option value="Player">Vận động viên</option>
              <option value="Referee">Trọng tài</option>
              <option value="Organization">Tổ chức/CLB</option>
            </select>
            <button className="auth-button" type="submit">TIẾP THEO</button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit}>
            <h2>BƯỚC 2: HỒ SƠ {userForm.role.toUpperCase()}</h2>
            {userForm.role === 'Player' && (
              <>
                <input className="auth-input" type="number" placeholder="Năm sinh" onChange={e => setProfileForm({...profileForm, birthYear: e.target.value})} required />
                <select className="auth-input" onChange={e => setProfileForm({...profileForm, skill: e.target.value})}>
                  <option value="2.0">Trình độ 2.0</option>
                  <option value="3.5">Trình độ 3.5</option>
                </select>
              </>
            )}
            {userForm.role === 'Organization' && (
              <>
                <input className="auth-input" placeholder="Tên tổ chức" onChange={e => setProfileForm({...profileForm, orgName: e.target.value})} required />
                <input className="auth-input" placeholder="Địa chỉ" onChange={e => setProfileForm({...profileForm, address: e.target.value})} required />
                <textarea className="auth-input" placeholder="Mô tả" onChange={e => setProfileForm({...profileForm, description: e.target.value})} />
              </>
            )}
            <button className="auth-button" type="submit" disabled={isSaving}>HOÀN TẤT</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup;