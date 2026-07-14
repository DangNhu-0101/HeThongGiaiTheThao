import api from "@/libs/axios";

export interface NewsRecord {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  topic: string;
  status: "draft" | "published" | "archived";
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

type ApiList<T> = T[] | { data?: T[] };
type ApiItem<T> = T | { data?: T };

const asArray = <T>(payload: ApiList<T>) => Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
const asItem = <T>(payload: ApiItem<T>) => (payload && typeof payload === "object" && "data" in payload ? payload.data : payload) as T;

export const newsService = {
  async list(params?: Record<string, unknown>) {
    const response = await api.get<ApiList<NewsRecord>>("/news", { params });
    return asArray(response.data);
  },
  async adminList(params?: Record<string, unknown>) {
    const response = await api.get<ApiList<NewsRecord>>("/news/admin/all", { params });
    return asArray(response.data);
  },
  async get(slugOrId: string) {
    const response = await api.get<ApiItem<NewsRecord>>(`/news/${slugOrId}`);
    return asItem(response.data);
  },
  async related(slug: string, limit = 8) {
    const response = await api.get<ApiList<NewsRecord>>(`/news/${slug}/related`, { params: { limit } });
    return asArray(response.data);
  },
  async topics() {
    const response = await api.get<ApiList<string>>("/news/topics/all");
    return asArray(response.data);
  },
  async create(payload: Partial<NewsRecord>) {
    const response = await api.post<{ data: NewsRecord }>("/news", payload);
    return response.data.data;
  },
  async update(id: string, payload: Partial<NewsRecord>) {
    const response = await api.put<{ data: NewsRecord }>(`/news/${id}`, payload);
    return response.data.data;
  },
  async remove(id: string) {
    await api.delete(`/news/${id}`);
  },
};
