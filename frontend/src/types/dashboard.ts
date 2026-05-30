// src/types/dashboard.ts

export interface IRefereeItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: string; // Cấp bậc trọng tài (Quốc gia, Tỉnh...)
}

export interface ICourtItem {
  id: string;
  name: string;
  location: string;
  status: "available" | "maintenance";
}