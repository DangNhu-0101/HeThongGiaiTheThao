import { useAuthStore } from "@/stores/useAuthStore";
import { Navigate, Outlet, } from "react-router";

export const ProtectedRoute = () => {
    const { accessToken, user,loading } = useAuthStore();

    if(!accessToken){
        return (
            <Navigate
                to="/login"
                replace
            />
        )
    }

    return(
        <Outlet></Outlet>
    )
}