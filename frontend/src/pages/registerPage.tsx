// pages/RegisterPage.tsx
import { useState } from 'react';
import { SignupStep1 } from '@/components/auth/signup-form';
import { SignupStep2 } from '@/components/auth/signup-form-2';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function RegisterPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'player',
        profileData: {}
    });
    const navigate = useNavigate();
    const [, setLoading] = useState(false);

    const handleStep1Submit = (data: unknown) => {
        console.log('Step1 data received', data);
        setFormData(prev => ({ ...prev, ...(data as object) }));
        setStep(2);
    };

    const handleStep2Submit = async (profileData: unknown) => {
        setLoading(true);
        try {
            const fullData = { ...formData, profileData };
            
            // Thực hiện gọi API đăng ký
            await useAuthStore.getState().register(fullData.email, fullData.password, fullData.username, fullData.phoneNumber, fullData.role, fullData.profileData);

            toast.success('Đăng ký tài khoản thành công!');
            navigate('/');
        } catch  {
            toast.error('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-md mx-auto py-10">
            {step === 1 && <SignupStep1 onSubmit={handleStep1Submit} defaultValues={formData} />}
            {step === 2 && <SignupStep2 role={formData.role} onSubmit={handleStep2Submit} onBack={() => setStep(1)} />}
        </div>
    );
}