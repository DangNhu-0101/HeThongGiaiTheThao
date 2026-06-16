import type { OrgAthleteRecord } from "@/types/orgAthleteMgmt";

export const mockAthleteRecords: OrgAthleteRecord[] = [
  {
    id: "a1", name: "Trần Anh Khoa", avatar: "AK", teamName: "FC Alpha United", teamLogo: "A", 
    gender: "Nam", age: 28, rating: "4.5", contact: "0901***123", status: "Active", registeredAt: "10 Thg 5, 2026"
  },
  {
    id: "a2", name: "Lê Hoàng Yến", avatar: "HY", teamName: "Thunder Hawks", teamLogo: "T", 
    gender: "Nữ", age: 24, rating: "4.0", contact: "0982***456", status: "Active", registeredAt: "11 Thg 5, 2026"
  },
  {
    id: "a3", name: "Phạm Minh Tuấn", avatar: "MT", teamName: "FC Dynamo", teamLogo: "D", 
    gender: "Nam", age: 31, rating: "3.5", contact: "0913***789", status: "Pending", registeredAt: "14 Thg 5, 2026"
  },
  {
    id: "a4", name: "Nguyễn Mai Phương", avatar: "MP", teamName: "Blue Eagles", teamLogo: "B", 
    gender: "Nữ", age: 22, rating: "4.5+", contact: "0934***012", status: "Pending", registeredAt: "15 Thg 5, 2026"
  },
  {
    id: "a5", name: "David Trần", avatar: "DT", teamName: "Sprint Masters", teamLogo: "S", 
    gender: "Nam", age: 35, rating: "5.0", contact: "david***@email.com", status: "Active", registeredAt: "01 Thg 5, 2026"
  },
  {
    id: "a6", name: "Hoàng Gia Bảo", avatar: "GB", teamName: "Iron Lions", teamLogo: "I", 
    gender: "Nam", age: 26, rating: "3.0", contact: "0975***345", status: "Suspended", registeredAt: "20 Thg 4, 2026"
  }
];