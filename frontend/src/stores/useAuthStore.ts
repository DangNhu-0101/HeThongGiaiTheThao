import {create} from "zustand";
import { persist } from "zustand/middleware";
import {toast} from "sonner";
import {authService} from "../services/authService";
import type { AuthState } from "../types/store";
import { clearStoredAuthTokens, setStoredAccessToken } from "@/utils/authToken";


export const useAuthStore = create<AuthState>()(
    persist(
        (set,get) =>  ({
            accessToken: null,
            authUser: null,
            loading: false,

            clearState: () => {
                clearStoredAuthTokens();
                set({accessToken: null, authUser: null ,loading: false});
            },


            register: async (email: string, password: string, username: string, phoneNumber: string, role: string, profileData: unknown) => {
                try{
                    set({loading: true})
                    const res = await authService.register(email, password, username, phoneNumber, role, profileData)
                    if (res && res.user && res.accessToken) {
                        setStoredAccessToken(res.accessToken);
                        set({ authUser: res.user, accessToken: res.accessToken })
                    }
                    toast.success("Đăng ký thành công", { duration: 2000 })
                }
                catch (err){
                    console.log(err)
                    toast.error("Đăng ký thất bại", { duration: 2000 })
                    throw err;
                }
                finally {
                    set({loading: false})
                }
            },
            login: async (username: string, password: string) => {
                try{
                    set({loading: true})
                    const res = await authService.login(username, password)
                    setStoredAccessToken(res.accessToken);
                    set({ authUser: res.user, accessToken: res.accessToken })
                    toast.success("Đăng nhập thành công", { duration: 2000 })
                }   
                catch (err){
                    console.log(err)
                    toast.error("Đăng nhập thất bại", { duration: 2000 })
                }
                finally {
                    set({loading: false})
                }
            },
            logout: async () => {
                try{
                    get().clearState();   
                    await authService.logout()
                    toast.success("Đăng xuất thành công", { duration: 2000 })
                }   
                catch (err){
                    console.log(err)
                    toast.error("Đăng xuất thất bại", { duration: 2000 })
                }
                finally {
                    set({loading: false})
                }   
            }
        }),
        {
            name: 'auth-storage', // Tên key lưu trong localStorage
        }
    )
)
