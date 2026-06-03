// pages/RegisterPage.tsx
import { useState } from 'react';
import { SignupStep1 } from '@/components/auth/signup-form';
import { SignupStep2 } from '@/components/auth/signup-form-2';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Định nghĩa kiểu dữ liệu cho Profile (thay đổi tùy theo Role)
interface ProfileData {
    [key: string]: unknown;
}

interface RegistrationFormData {
    username: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: string;
    profileData: ProfileData;
}

export function RegisterPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<RegistrationFormData>({
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'player',
        profileData: {}
    });
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleStep1Submit = (data: Partial<RegistrationFormData>) => {
        console.log('Step1 data received', data);
        setFormData(prev => ({ ...prev, ...data }));
        setStep(2);
    };

    const handleStep2Submit = async (profileData: ProfileData) => {
        setLoading(true);
        try {
            const fullData = { ...formData, profileData };
            
            console.log('Payload gửi đi:', fullData);
            
            // Thực hiện gọi API đăng ký
            await useAuthStore.getState().register(fullData.email, fullData.password, fullData.username, fullData.phoneNumber, fullData.role, fullData.profileData);

            navigate('/');
        } catch (error) {
            // Thay thế 'any' bằng kiểu dữ liệu cấu trúc để lấy message từ response của Axios
            const axiosError = error as { response?: { data?: { message?: string } } };
            const errMsg = axiosError.response?.data?.message || 'Đăng ký thất bại.';
            console.error("Lỗi đăng ký:", errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        /* Sử dụng biến loading để làm mờ và chặn tương tác khi đang gửi yêu cầu */
        <div className={`container max-w-md mx-auto py-10 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            {step === 1 && <SignupStep1 onSubmit={handleStep1Submit} defaultValues={formData} />}
            {step === 2 && <SignupStep2 
                role={formData.role} 
                onSubmit={(data: ProfileData) => { void handleStep2Submit(data); }} 
                onBack={() => setStep(1)} 
            />}
        </div>
    );
}