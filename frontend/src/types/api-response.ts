// Gói dữ liệu chuẩn từ Backend (đúng với cấu trúc bạn đang dùng)
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Ví dụ sử dụng:
// const res: ApiResponse<Team[]> = await api.get('/teams/users');