import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    // Dữ liệu Bước 1 (Thông tin đăng nhập)
    const [userForm, setUserForm] = useState({
        username: '', 
        email: '', 
        phoneNumber: '', 
        password: '', 
        confirmPassword: '', 
        role: 'player'
    });

    // Dữ liệu Bước 2 (Chi tiết hồ sơ)
    const [profileForm, setProfileForm] = useState({
        name: '', 
        birthDate: '', 
        gender: 'male',
        category: 'Pickleball', 
        level: '3.0',
        yearsOfExperience: 0,
        city: '', 
        district: '', 
        detail: ''
    });

    // --- VALIDATION BƯỚC 1 ---
    const validateStep1 = () => {
        let errs = {};
        if (!userForm.username) errs.username = "Tên đăng nhập không được để trống!";
        if (!userForm.email) errs.email = "Email không được để trống!";
        else if (!/\S+@\S+\.\S+/.test(userForm.email)) errs.email = "Email không hợp lệ!";
        
        if (!userForm.phoneNumber) errs.phoneNumber = "Số điện thoại không được để trống!";
        else if (!/^\d{10}$/.test(userForm.phoneNumber)) errs.phoneNumber = "SĐT phải có 10 chữ số!";
        
        if (!userForm.password) errs.password = "Mật khẩu không được để trống!";
        else if (userForm.password.length < 6) errs.password = "Mật khẩu phải từ 6 ký tự!";
        
        if (userForm.password !== userForm.confirmPassword) errs.confirmPassword = "Mật khẩu xác nhận không khớp!";
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // --- VALIDATION BƯỚC 2 ---
    const validateStep2 = () => {
        let errs = {};
        if (!profileForm.name) errs.name = "Họ và tên/Tên tổ chức không được để trống!";
        if (userForm.role !== 'Organization' && !profileForm.birthDate) errs.birthDate = "Vui lòng chọn ngày sinh!";
        
        if (userForm.role === 'Organization') {
            if (!profileForm.city) errs.city = "Vui lòng nhập thành phố!";
            if (!profileForm.detail) errs.detail = "Vui lòng nhập địa chỉ chi tiết!";
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // --- XỬ LÝ CHUYỂN BƯỚC (KHÔNG GỌI API) ---
    const handleNextStep = (e) => {
        e.preventDefault();
        if (validateStep1()) {
            setErrors({});
            setStep(2);
        }
    };

    const handleBackStep = () => {
        setErrors({});
        setStep(1);
    };

    // --- XỬ LÝ LƯU TỔNG THỂ (GỌI API TỔNG) ---
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;

        try {
            setIsSaving(true);
            setErrors({});

            // Gộp tất cả thông tin vào 1 payload duy nhất
            const finalPayload = {
                // Thông tin User
                username: userForm.username,
                email: userForm.email,
                phoneNumber: userForm.phoneNumber,
                password: userForm.password,
                role: userForm.role,
                // Thông tin Profile lồng bên trong
                profileData: {
                    name: profileForm.name,
                    gender: profileForm.gender,
                    birthDate: profileForm.birthDate,
                    skill: profileForm.level,
                    experienceYears: Number(profileForm.yearsOfExperience),
                    city: profileForm.city,
                    district: profileForm.district,
                    detail: profileForm.detail
                }
            };


            await api.post('auth/register-full', finalPayload);

            setIsSubmitted(true);
        } catch (err) {
            setErrors({ server: err.response?.data?.message || "Lỗi hệ thống khi lưu dữ liệu." });
        } finally {
            setIsSaving(false);
        }
    };

    if (isSubmitted) return (
        <div className="auth-container bg-dark-forest">
            <div className="auth-card text-center border-t-4 border-primary-lime animate-fade-in">
                <h2 className="text-primary-lime font-title text-4xl italic leading-none">KHỞI TẠO THÀNH CÔNG</h2>
                <p className="text-neutral-cream mt-4 uppercase font-bold text-[10px] tracking-widest">Tài khoản và hồ sơ của bạn đã sẵn sàng.</p>
                <button className="auth-button mt-8 shadow-[0_0_15px_#CEF15F]" onClick={() => navigate('/login')}>ĐĂNG NHẬP NGAY</button>
            </div>
        </div>
    );

    return (
        <div className="auth-container bg-dark-forest font-body">
            <div className="auth-card border-t-4 border-teal-accent max-w-lg">
                
                {/* THANH TIẾN ĐỘ 2 BƯỚC */}
                <div className="flex items-center justify-between mb-10 px-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step >= 1 ? 'bg-primary-lime text-dark-forest shadow-[0_0_10px_#CEF15F]' : 'bg-slate-800 text-gray-500'}`}>1</div>
                        <span className={`text-[10px] font-black uppercase ${step >= 1 ? 'text-primary-lime' : 'text-gray-500'}`}>Tài khoản</span>
                    </div>
                    <div className={`flex-1 h-[2px] mx-4 transition-all ${step >= 2 ? 'bg-primary-lime' : 'bg-slate-800'}`}></div>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step === 2 ? 'bg-primary-lime text-dark-forest shadow-[0_0_10px_#CEF15F]' : 'bg-slate-800 text-gray-500'}`}>2</div>
                        <span className={`text-[10px] font-black uppercase ${step === 2 ? 'text-primary-lime' : 'text-gray-500'}`}>Hồ sơ vai trò {userForm.role}</span>
                    </div>
                </div>

                {errors.server && <div className="mb-4 p-2 bg-red-500/20 border border-red-500 text-red-500 text-xs font-bold uppercase">{errors.server}</div>}

                {step === 1 ? (
                    <form onSubmit={handleNextStep} className="space-y-4">
                        <h2 className="text-white font-title text-2xl italic uppercase tracking-tighter mb-6">Đăng ký tài khoản</h2>
                        
                        <div>
                            <label className="auth-label">Tên đăng nhập</label>
                            <input className={`auth-input ${errors.username ? 'border-red-500' : ''}`} placeholder="Nhập username..." value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} />
                            {errors.username && <p className="error-text">{errors.username}</p>}
                        </div>

                        <div>
                            <label className="auth-label">Email hệ thống</label>
                            <input className={`auth-input ${errors.email ? 'border-red-500' : ''}`} placeholder="email@example.com" type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                            {errors.email && <p className="error-text">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="auth-label">Số điện thoại</label>
                            <input className={`auth-input ${errors.phoneNumber ? 'border-red-500' : ''}`} placeholder="Nhập số điện thoại..." value={userForm.phoneNumber} onChange={e => setUserForm({...userForm, phoneNumber: e.target.value})} />
                            {errors.phoneNumber && <p className="error-text">{errors.phoneNumber}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="auth-label">Mật khẩu</label>
                                <input className={`auth-input ${errors.password ? 'border-red-500' : ''}`} type="password" placeholder="••••••" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                                {errors.password && <p className="error-text">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="auth-label">Xác nhận</label>
                                <input className={`auth-input ${errors.confirmPassword ? 'border-red-500' : ''}`} type="password" placeholder="••••••" value={userForm.confirmPassword} onChange={e => setUserForm({...userForm, confirmPassword: e.target.value})} />
                                {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="auth-label text-teal-accent">Vai trò tham gia</label>
                            <select className="auth-input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                                <option value="player">Vận động viên</option>
                                <option value="referee">Trọng tài</option>
                                <option value="Organization">Tổ chức</option>
                            </select>
                        </div>

                        <button className="auth-button bg-primary-lime text-dark-forest font-black" type="submit">TIẾP TỤC BƯỚC 2</button>
                    </form>
                ) : (
                    <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fade-in">
                        <h2 className="text-primary-lime font-title text-2xl italic uppercase mb-6">Thông tin chi tiết hồ sơ</h2>
                        
                        <div>
                            <label className="auth-label">{userForm.role === 'Organization' ? "Tên Tổ chức / CLB" : "Họ và tên hiển thị"}</label>
                            <input className={`auth-input ${errors.name ? 'border-red-500' : ''}`} placeholder="Nhập tên..." value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                            {errors.name && <p className="error-text">{errors.name}</p>}
                        </div>

                        {userForm.role !== 'Organization' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="auth-label">Ngày sinh</label>
                                    <input className={`auth-input ${errors.birthDate ? 'border-red-500' : ''}`} type="date" value={profileForm.birthDate} onChange={e => setProfileForm({...profileForm, birthDate: e.target.value})} />
                                    {errors.birthDate && <p className="error-text">{errors.birthDate}</p>}
                                </div>
                                <div>
                                    <label className="auth-label">Giới tính</label>
                                    <select className="auth-input" value={profileForm.gender} onChange={e => setProfileForm({...profileForm, gender: e.target.value})}>
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {userForm.role === 'player' && (
                            <div>
                                <label className="auth-label text-primary-lime">Trình độ Pickleball</label>
                                <select className="auth-input" value={profileForm.level} onChange={e => setProfileForm({...profileForm, level: e.target.value})}>
                                    
                                    <option value="1.5">1.5 - Mới chơi</option>
                                    <option value="2.0">2.0 - Cơ bản</option>   
                                    <option value="2.5">2.5 - Cơ bản nâng cao</option>
                                    <option value="3.0">3.0 - Trung cấp</option>
                                    <option value="3.5">3.5 - Trung cấp nâng cao</option>
                                    <option value="4.0">4.0 - Nâng cao</option>
                                    <option value="4.5">4.5 - Bán chuyên</option>
                                    <option value="5.0">5.0 - Chuyên nghiệp</option>
                                </select>
                            </div>
                        )}

                        {userForm.role === 'referee' && (
                            <div>
                                <label className="auth-label">Số năm kinh nghiệm</label>
                                <input className="auth-input" type="number" value={profileForm.yearsOfExperience} onChange={e => setProfileForm({...profileForm, yearsOfExperience: e.target.value})} />
                            </div>
                        )}

                        {userForm.role === 'Organization' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="auth-label">Thành phố</label>
                                        <input className={`auth-input ${errors.city ? 'border-red-500' : ''}`} placeholder="VD: Vũng Tàu" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} />
                                        {errors.city && <p className="error-text">{errors.city}</p>}
                                    </div>
                                    <div>
                                        <label className="auth-label">Phường/Xã</label>
                                        <input className="auth-input" placeholder="Nhập phường..." value={profileForm.district} onChange={e => setProfileForm({...profileForm, district: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="auth-label">Địa chỉ chi tiết</label>
                                    <input className={`auth-input ${errors.detail ? 'border-red-500' : ''}`} placeholder="Số nhà, tên đường..." value={profileForm.detail} onChange={e => setProfileForm({...profileForm, detail: e.target.value})} />
                                    {errors.detail && <p className="error-text">{errors.detail}</p>}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-6">
                            <button type="button" onClick={handleBackStep} className="auth-button bg-slate-800 text-white">QUAY LẠI</button>
                            <button className="auth-button bg-primary-lime text-dark-forest font-black" type="submit" disabled={isSaving}>
                                {isSaving ? "ĐANG LƯU..." : "HOÀN TẤT"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <style>{`
                .auth-label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; color: #94a3b8; }
                .error-text { color: #f87171; font-size: 10px; margin-top: 4px; font-weight: 700; font-style: italic; }
            `}</style>
        </div>
    );
};

export default Register;