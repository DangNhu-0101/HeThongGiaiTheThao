import { create } from "zustand";

export interface MinimalTournament {
  id: string;
  name: string;
}

export interface OrgContextState {
  tournaments: MinimalTournament[];
  selectedTournamentId: string;
  setSelectedTournamentId: (id: string) => void;
}

export const useOrgContextStore = create<OrgContextState>((set) => ({
  // Dữ liệu giả lập danh sách giải đấu của Tổ chức này
  tournaments: [
    { id: "all", name: "Tất cả giải đấu (Tổng hợp)" },
    { id: "t1", name: "Giải Pickleball Vũng Tàu 2026" },
    { id: "t2", name: "Cúp Hà Nội 2026" },
    { id: "t3", name: "Giải Trẻ Mở Rộng Hè" },
    { id: "t4", name: "Giải Các CLB Bãi Biển" }
  ],
  // Mặc định chọn "Tất cả"
  selectedTournamentId: "all",
  
  // Hàm cập nhật giải đấu
  setSelectedTournamentId: (id) => set({ selectedTournamentId: id })
}));