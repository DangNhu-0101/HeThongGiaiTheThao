import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const [userForm, setUserForm] = useState({
        username: '', password: '', confirmPassword: '', email: '', displayName: '', phoneNumber: '', role: 'Player'
    });

    const [profileForm, setProfileForm] = useState({
        birthYear: '', 
        gender: 'male', 
        skill: '3.0', 
        experienceYears: '',
        orgName: '', 
        address: '', 
        description: ''
    });

    const handleStep1Submit = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            
            // GỘP DỮ LIỆU: Phải gửi cả gender và birthYear ở Bước 1
            const registrationData = { 
                ...userForm, 
                gender: profileForm.gender, 
                birthYear: profileForm.birthYear 
            };

            const regRes = await api.post('auth/register', registrationData);

            if (regRes.data.accessToken) {
                localStorage.setItem('accessToken', regRes.data.accessToken);
                // Decode token lấy userId để làm Bước 2
                const tokenPayload = JSON.parse(atob(regRes.data.accessToken.split('.')[1]));
                setCurrentUserId(tokenPayload.userId);
                setStep(2);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi đăng ký Bước 1.");
        } finally { setIsSaving(false); }
    };

    const handleStep2Submit = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            let payload = { userId: currentUserId, name: userForm.displayName };

            if (userForm.role === 'Player') {
                payload = { ...payload, skill: Number(profileForm.skill) };
            } else if (userForm.role === 'Referee') {
                payload = { ...payload, experienceYears: Number(profileForm.experienceYears) };
            } else if (userForm.role === 'Organization') {
                payload = { 
                    ...payload,
                    orgName: profileForm.orgName,
                    address: profileForm.address,
                    description: profileForm.description,
                    phone: userForm.phoneNumber
                };
            }

            await api.post('users/completeUser', payload);
            setIsSubmitted(true);
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi hoàn thiện hồ sơ Bước 2.");
        } finally { setIsSaving(false); }
    };

    if (isSubmitted) return (
        <div className="auth-container">
            <div className="auth-card text-center">
                <h2 className="text-forest">🎉 CHÚC MỪNG!</h2>
                <p>Tài khoản của bạn đã sẵn sàng tham gia cộng đồng Pickleball.</p>
                <button className="auth-button" onClick={() => navigate('/login')}>ĐĂNG NHẬP NGAY</button>
            </div>
        </div>
    );

    return (
        <div className="auth-container">
            <div className="auth-card">
                {step === 1 ? (
                    <form onSubmit={handleStep1Submit} className="space-y-4">
                        <h2 className="text-forest uppercase font-black">Bước 1: Tạo tài khoản</h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <input className="auth-input" placeholder="Tên hiển thị" value={userForm.displayName} onChange={e => setUserForm({...userForm, displayName: e.target.value})} required />
                            <input className="auth-input" placeholder="Số điện thoại" value={userForm.phoneNumber} onChange={e => setUserForm({...userForm, phoneNumber: e.target.value})} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input className="auth-input" type="number" placeholder="Năm sinh" value={profileForm.birthYear} onChange={e => setProfileForm({...profileForm, birthYear: e.target.value})} required />
                            <select className="auth-input" value={profileForm.gender} onChange={e => setProfileForm({...profileForm, gender: e.target.value})}>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                            </select>
                        </div>

                        <input className="auth-input" placeholder="Email" type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
                        <input className="auth-input" placeholder="Tên đăng nhập" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <input className="auth-input" type="password" placeholder="Mật khẩu" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />
                            <input className="auth-input" type="password" placeholder="Xác nhận lại" value={userForm.confirmPassword} onChange={e => setUserForm({...userForm, confirmPassword: e.target.value})} required />
                        </div>

                        <select className="auth-input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                            <option value="Player">Vận động viên (Player)</option>
                            <option value="Referee">Trọng tài (Referee)</option>
                            <option value="Organization">Tổ chức/CLB (Admin)</option>
                        </select>

                        <button className="auth-button" type="submit" disabled={isSaving}>
                            {isSaving ? "ĐANG XỬ LÝ..." : "TIẾP THEO"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleStep2Submit} className="space-y-4">
                        <h2 className="text-forest uppercase font-black">Bước 2: Hồ sơ {userForm.role}</h2>
                        
                        {userForm.role === 'Player' && (
                            <div className="space-y-4">
                                <label className="info-label">Trình độ kỹ thuật (Skill Level)</label>
                                <select className="auth-input" value={profileForm.skill} onChange={e => setProfileForm({...profileForm, skill: e.target.value})}>
                                      <option value="1.0">1.0 - Người mới làm quen</option>
                                        <option value="1.5">1.5 - Người mới chơi</option>
                                        <option value="2.0">2.0 - Cơ bản</option>
                                        <option value="2.5">2.5 - Cơ bản nâng cao</option>
                                        <option value="3.0">3.0 - Trung cấp</option>
                                        <option value="3.5">3.5 - Trung cấp nâng cao</option>
                                        <option value="4.0">4.0 - Nâng cao</option>
                                        <option value="4.5">4.5 - Thi đấu nâng cao</option>
                                        <option value="5.0">5.0 - Chuyên nghiệp</option>
                                  </select>
                            </div>
                        )}

                        {userForm.role === 'Referee' && (
                            <input className="auth-input" type="number" placeholder="Số năm kinh nghiệm cầm còi" value={profileForm.experienceYears} onChange={e => setProfileForm({...profileForm, experienceYears: e.target.value})} required />
                        )}

                        {userForm.role === 'Organization' && (
                            <div className="space-y-4">
                                <input className="auth-input" placeholder="Tên câu lạc bộ / Tổ chức" value={profileForm.orgName} onChange={e => setProfileForm({...profileForm, orgName: e.target.value})} required />
                                <input className="auth-input" placeholder="Địa chỉ trụ sở" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} required />
                                <textarea className="auth-input" placeholder="Mô tả ngắn về CLB của bạn..." value={profileForm.description} onChange={e => setProfileForm({...profileForm, description: e.target.value})} />
                            </div>
                        )}

                        <button className="auth-button" type="submit" disabled={isSaving}>
                            {isSaving ? "ĐANG LƯU HỒ SƠ..." : "HOÀN TẤT ĐĂNG KÝ"}
                        </button>
                    </form>
                    
                )}
                <p className="text-center text-sm text-gray-400">
                            Đã có tài khoản?{' '}
                            <button 
                                onClick={() => navigate('/login')}
                                className="text-cyan-500 hover:text-cyan-400 underline"
                            >
                                Đăng nhập ngay
                            </button>
                        </p>
            </div>
        </div>
    );
};

export default Register;