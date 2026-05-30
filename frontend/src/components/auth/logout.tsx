import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";

export const Logout = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    }
    return(
        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded">Đăng xuất</button>
    )
}