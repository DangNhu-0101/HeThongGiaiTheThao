export interface PaymentRequest {
  transactionCode: string; // Mã giao dịch (FT123456...)
  senderName: string;      // Tên người chuyển khoản
  receipt?: File;          // Ảnh minh chứng (dạng File khi dùng FormData)
}

export interface PaymentStatus {
  isPaid: boolean;
  paidAt?: Date | null;
  transactionId?: string;
  paymentProofUrl?: string; // URL ảnh đã upload trên server
  status: 'pending' | 'validated' | 'rejected'; // Trạng thái duyệt của BTC
}