import api from "@/libs/axios";

export interface ContactAttachment {
  url: string;
  path?: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  content: string;
  attachments: ContactAttachment[];
  isRead: boolean;
  readAt?: string | null;
  repliedAt?: string | null;
  createdAt: string;
}

export interface ContactMessageList {
  data: ContactMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const contactMessageService = {
  async create(payload: Omit<ContactMessage, "id" | "isRead" | "createdAt" | "readAt" | "repliedAt">) {
    const response = await api.post<{ data: ContactMessage }>("/contact-messages", payload);
    return response.data.data;
  },
  async list(params: { page?: number; limit?: number; search?: string; read?: string }) {
    const response = await api.get<ContactMessageList>("/contact-messages/admin", { params });
    return response.data;
  },
  async update(id: string, payload: { isRead?: boolean; repliedAt?: string | boolean }) {
    const response = await api.patch<{ data: ContactMessage }>(`/contact-messages/admin/${id}`, payload);
    return response.data.data;
  },
  async remove(id: string) {
    await api.delete(`/contact-messages/admin/${id}`);
  },
};
