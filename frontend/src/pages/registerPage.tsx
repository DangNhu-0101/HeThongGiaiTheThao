import { useState } from "react";
import AuthLayout from "@/components/layout/authLayout";
import { SignupStep1 } from "@/components/auth/SignupStep1";
import { SignupStep2 } from "@/components/auth/SignupStep2";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { getManagementPath } from "@/libs/auth";

export function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const { register: registerAccount } = useAuthStore();
  const navigate = useNavigate();

  const handleStep1Submit = (data: any) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };

  const handleStep2Submit = async (data: any) => {
    const finalData = { ...formData, ...data };
    await registerAccount(
      finalData.email,
      finalData.password,
      finalData.username,
      finalData.phoneNumber,
      finalData.role,
      data,
    );
    const role = useAuthStore.getState().user?.role;
    navigate(getManagementPath(role));
  };

  return (
    <AuthLayout>
      <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden p-8 sm:p-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-foreground mb-2">Tao tai khoan moi</h2>
          <p className="text-sm text-muted-foreground">Tham gia nen tang quan ly the thao hang dau.</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex flex-col items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? "border-primary bg-primary/10" : "border-border"}`}>1</div>
            <span className="text-[10px] font-bold uppercase">Tai khoan</span>
          </div>
          <div className={`w-16 h-0.5 ${step >= 2 ? "bg-primary" : "bg-border"}`} />
          <div className={`flex flex-col items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? "border-primary bg-primary/10" : "border-border"}`}>2</div>
            <span className="text-[10px] font-bold uppercase">Ho so</span>
          </div>
        </div>

        {step === 1 && <SignupStep1 onSubmit={handleStep1Submit} defaultValues={formData} />}

        {step === 2 && (
          <SignupStep2 role={formData.role} onSubmit={handleStep2Submit} onBack={() => setStep(1)} />
        )}
      </div>
    </AuthLayout>
  );
}
