import api from "../libs/axios"; // Đường dẫn file cấu hình axios mới của bạn

export const tournamentService = {
  // Lấy danh sách Đơn vị tổ chức
  getOrganizations: async () => {
    const res = await api.get('/users/organizations');
    // Trích xuất data mượt mà không cần any, hỗ trợ fallback tùy cấu trúc trả về
    return res.data?.data?.data || res.data?.data || res.data?.org || [];
  },
getAll: async () => {
    const res = await api.get('/tournaments');
    return res.data?.data || res.data || [];
  },
  // Lấy chi tiết giải đấu theo ID
  getById: async (id: string) => {
    const res = await api.get(`/tournaments/${id}`);
    return res.data?.data;
  },

  // Tạo mới
  create: async (payload: FormData) => {
    const res = await api.post('/tournaments/createTournament', payload);
    return res.data;
  },

  // Cập nhật
  update: async (id: string, payload: FormData) => {
    const res = await api.put(`/tournaments/${id}`, payload);
    return res.data;
  }
};