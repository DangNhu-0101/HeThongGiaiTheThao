import {create} from "zustand";
import {toast} from "sonner";
import {authService} from "../services/authService";
import type { AuthState } from "../types/store";


export const useAuthStore = create<AuthState>((set,get) =>  ({
    accessToken: null,
    user: null,
    loading: false,

    clearState: () => set({accessToken: null, user: null ,loading: false}),


    register: async (email: string, password: string, username: string, phonenumber: string, role: string, profileData: unknown) => {
        try{
            set({loading: true})
            await authService.register(email, password, username, phonenumber, role, profileData)
            toast.success("Đăng ký thành công")
        }
        catch (err){
            console.log(err)
            toast.error("Đăng ký thất bại")
        }
        finally {
            set({loading: false})
        }
    },
    login: async (email: string, password: string) => {
        try{
            set({loading: true})
            await authService.login(email, password)
            toast.success("Đăng nhập thành công")
        }   
        catch (err){
            console.log(err)
            toast.error("Đăng nhập thất bại")
        }
        finally {
            set({loading: false})
        }
    },
    logout: async () => {
        try{
            get().clearState();   
            await authService.logout()
            toast.success("Đăng xuất thành công")
        }   
        catch (err){
            console.log(err)
            toast.error("Đăng xuất thất bại")
        }
        finally {
            set({loading: false})
        }   
    }
}))