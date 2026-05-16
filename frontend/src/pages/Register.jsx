import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    const [userForm, setUserForm] = useState({
        username: '', 
        email: '', 
        phoneNumber: '', 
        password: '', 
        confirmPassword: '', 
        role: 'player'
    });

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

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;

        try {
            setIsSaving(true);
            setErrors({});

            const finalPayload = {
                username: userForm.username,
                email: userForm.email,
                phoneNumber: userForm.phoneNumber,
                password: userForm.password,
                role: userForm.role,
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
        <>
            <style>{`
                .register-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                }

                @media (max-width: 768px) {
                    .register-container {
                        padding: 30px 16px;
                    }
                }

                @media (max-width: 640px) {
                    .register-container {
                        padding: 20px 12px;
                    }
                }

                .register-card {
                    background: rgba(15, 23, 42, 0.9);
                    backdrop-filter: blur(10px);
                    border-radius: 24px;
                    padding: 40px;
                    max-width: 500px;
                    width: 100%;
                    border-top: 4px solid #14b8a6;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }

                @media (max-width: 640px) {
                    .register-card {
                        padding: 24px;
                        border-radius: 20px;
                    }
                }

                .register-progress {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    padding: 0 16px;
                }

                @media (max-width: 640px) {
                    .register-progress {
                        margin-bottom: 30px;
                        padding: 0 8px;
                    }
                }

                .register-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .register-step-number {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 900;
                    font-size: 0.7rem;
                    transition: all 0.3s;
                }

                .register-step-number-active {
                    background: #cef15f;
                    color: #0f172a;
                    box-shadow: 0 0 10px #cef15f;
                }

                .register-step-number-inactive {
                    background: #1e293b;
                    color: #64748b;
                }

                .register-step-label {
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                }

                .register-step-label-active {
                    color: #cef15f;
                }

                .register-step-label-inactive {
                    color: #64748b;
                }

                .register-progress-line {
                    flex: 1;
                    height: 2px;
                    margin: 0 16px;
                    transition: all 0.3s;
                }

                .register-progress-line-active {
                    background: #cef15f;
                }

                .register-progress-line-inactive {
                    background: #1e293b;
                }

                .register-title {
                    color: #fff;
                    font-size: 1.5rem;
                    font-weight: 900;
                    font-style: italic;
                    text-transform: uppercase;
                    margin-bottom: 24px;
                }

                @media (max-width: 640px) {
                    .register-title {
                        font-size: 1.25rem;
                        margin-bottom: 20px;
                    }
                }

                .register-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .register-label {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                    color: #94a3b8;
                }

                .register-input {
                    width: 100%;
                    padding: 12px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    color: #fff;
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.2s;
                }

                @media (max-width: 640px) {
                    .register-input {
                        padding: 10px;
                        font-size: 16px;
                    }
                }

                .register-input:focus {
                    border-color: #14b8a6;
                    box-shadow: 0 0 0 3px rgba(20,184,166,0.1);
                }

                .register-input-error {
                    border-color: #ef4444;
                }

                .register-error-text {
                    color: #f87171;
                    font-size: 0.6rem;
                    margin-top: 4px;
                    font-weight: 700;
                }

                .register-server-error {
                    padding: 12px;
                    background: rgba(239,68,68,0.2);
                    border: 1px solid #ef4444;
                    border-radius: 8px;
                    color: #f87171;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 16px;
                }

                .register-grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }

                @media (max-width: 640px) {
                    .register-grid-2 {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }

                .register-btn {
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    font-weight: 900;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 8px;
                }

                @media (max-width: 640px) {
                    .register-btn {
                        padding: 12px;
                        font-size: 0.7rem;
                    }
                }

                .register-btn-primary {
                    background: #cef15f;
                    color: #0f172a;
                }

                .register-btn-secondary {
                    background: #1e293b;
                    color: #fff;
                }

                .register-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .register-actions {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-top: 24px;
                }

                @media (max-width: 640px) {
                    .register-actions {
                        gap: 12px;
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
            `}</style>

            <div className="register-container">
                <div className="register-card">
                    
                    <div className="register-progress">
                        <div className="register-step">
                            <div className={`register-step-number ${step >= 1 ? 'register-step-number-active' : 'register-step-number-inactive'}`}>1</div>
                            <span className={`register-step-label ${step >= 1 ? 'register-step-label-active' : 'register-step-label-inactive'}`}>Tài khoản</span>
                        </div>
                        <div className={`register-progress-line ${step >= 2 ? 'register-progress-line-active' : 'register-progress-line-inactive'}`}></div>
                        <div className="register-step">
                            <div className={`register-step-number ${step === 2 ? 'register-step-number-active' : 'register-step-number-inactive'}`}>2</div>
                            <span className={`register-step-label ${step === 2 ? 'register-step-label-active' : 'register-step-label-inactive'}`}>Hồ sơ</span>
                        </div>
                    </div>

                    {errors.server && <div className="register-server-error">{errors.server}</div>}

                    {step === 1 ? (
                        <form onSubmit={handleNextStep} className="register-form">
                            <h2 className="register-title">Đăng ký tài khoản</h2>
                            
                            <div>
                                <label className="register-label">Tên đăng nhập</label>
                                <input className={`register-input ${errors.username ? 'register-input-error' : ''}`} placeholder="Nhập username..." value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} />
                                {errors.username && <p className="register-error-text">{errors.username}</p>}
                            </div>

                            <div>
                                <label className="register-label">Email hệ thống</label>
                                <input className={`register-input ${errors.email ? 'register-input-error' : ''}`} placeholder="email@example.com" type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                                {errors.email && <p className="register-error-text">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="register-label">Số điện thoại</label>
                                <input className={`register-input ${errors.phoneNumber ? 'register-input-error' : ''}`} placeholder="Nhập số điện thoại..." value={userForm.phoneNumber} onChange={e => setUserForm({...userForm, phoneNumber: e.target.value})} />
                                {errors.phoneNumber && <p className="register-error-text">{errors.phoneNumber}</p>}
                            </div>

                            <div className="register-grid-2">
                                <div>
                                    <label className="register-label">Mật khẩu</label>
                                    <input className={`register-input ${errors.password ? 'register-input-error' : ''}`} type="password" placeholder="••••••" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                                    {errors.password && <p className="register-error-text">{errors.password}</p>}
                                </div>
                                <div>
                                    <label className="register-label">Xác nhận</label>
                                    <input className={`register-input ${errors.confirmPassword ? 'register-input-error' : ''}`} type="password" placeholder="••••••" value={userForm.confirmPassword} onChange={e => setUserForm({...userForm, confirmPassword: e.target.value})} />
                                    {errors.confirmPassword && <p className="register-error-text">{errors.confirmPassword}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="register-label" style={{ color: '#14b8a6' }}>Vai trò tham gia</label>
                                <select className="register-input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                                    <option value="player">Vận động viên</option>
                                    <option value="referee">Trọng tài</option>
                                    <option value="Organization">Tổ chức</option>
                                </select>
                            </div>

                            <button className="register-btn register-btn-primary" type="submit">TIẾP TỤC BƯỚC 2</button>
                        </form>
                    ) : (
                        <form onSubmit={handleFinalSubmit} className="register-form animate-fade-in">
                            <h2 className="register-title" style={{ color: '#cef15f' }}>Thông tin chi tiết hồ sơ</h2>
                            
                            <div>
                                <label className="register-label">{userForm.role === 'Organization' ? "Tên Tổ chức / CLB" : "Họ và tên hiển thị"}</label>
                                <input className={`register-input ${errors.name ? 'register-input-error' : ''}`} placeholder="Nhập tên..." value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                                {errors.name && <p className="register-error-text">{errors.name}</p>}
                            </div>

                            {userForm.role !== 'Organization' && (
                                <div className="register-grid-2">
                                    <div>
                                        <label className="register-label">Ngày sinh</label>
                                        <input className={`register-input ${errors.birthDate ? 'register-input-error' : ''}`} type="date" value={profileForm.birthDate} onChange={e => setProfileForm({...profileForm, birthDate: e.target.value})} />
                                        {errors.birthDate && <p className="register-error-text">{errors.birthDate}</p>}
                                    </div>
                                    <div>
                                        <label className="register-label">Giới tính</label>
                                        <select className="register-input" value={profileForm.gender} onChange={e => setProfileForm({...profileForm, gender: e.target.value})}>
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {userForm.role === 'player' && (
                                <div>
                                    <label className="register-label" style={{ color: '#cef15f' }}>Trình độ Pickleball</label>
                                    <select className="register-input" value={profileForm.level} onChange={e => setProfileForm({...profileForm, level: e.target.value})}>
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
                                    <label className="register-label">Số năm kinh nghiệm</label>
                                    <input className="register-input" type="number" value={profileForm.yearsOfExperience} onChange={e => setProfileForm({...profileForm, yearsOfExperience: e.target.value})} />
                                </div>
                            )}

                            {userForm.role === 'Organization' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="register-grid-2">
                                        <div>
                                            <label className="register-label">Thành phố</label>
                                            <input className={`register-input ${errors.city ? 'register-input-error' : ''}`} placeholder="VD: Vũng Tàu" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} />
                                            {errors.city && <p className="register-error-text">{errors.city}</p>}
                                        </div>
                                        <div>
                                            <label className="register-label">Phường/Xã</label>
                                            <input className="register-input" placeholder="Nhập phường..." value={profileForm.district} onChange={e => setProfileForm({...profileForm, district: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="register-label">Địa chỉ chi tiết</label>
                                        <input className={`register-input ${errors.detail ? 'register-input-error' : ''}`} placeholder="Số nhà, tên đường..." value={profileForm.detail} onChange={e => setProfileForm({...profileForm, detail: e.target.value})} />
                                        {errors.detail && <p className="register-error-text">{errors.detail}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="register-actions">
                                <button type="button" onClick={handleBackStep} className="register-btn register-btn-secondary">QUAY LẠI</button>
                                <button className="register-btn register-btn-primary" type="submit" disabled={isSaving}>
                                    {isSaving ? "ĐANG LƯU..." : "HOÀN TẤT"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default Register;