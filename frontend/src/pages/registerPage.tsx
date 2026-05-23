// pages/RegisterPage.tsx
import { useState } from 'react';
import { SignupStep1 } from '@/components/auth/signup-form';
import { SignupStep2 } from '@/components/auth/signup-form-2';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

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

    const handleStep1Submit = (data: any) => {
        console.log('Step1 data received', data);
        setFormData(prev => ({ ...prev, ...data }));
        setStep(2);
    };

    const handleStep2Submit = async (profileData: any) => {
        const fullData = { ...formData, profileData };
        
        await useAuthStore.getState().register(fullData.email, fullData.password, fullData.username, fullData.phoneNumber, fullData.role, fullData.profileData);

        navigate('/');
    };

    return (
        <div className="container max-w-md mx-auto py-10">
            {step === 1 && <SignupStep1 onSubmit={handleStep1Submit} defaultValues={formData} />}
            {step === 2 && <SignupStep2 role={formData.role} onSubmit={handleStep2Submit} onBack={() => setStep(1)} />}
        </div>
    );
}