import heroImage from "@/assets/hero.png";
import type { NewsRecord } from "@/services/newsService";

export const newsFallbackImage = heroImage;

export const stripHtml = (value?: string) => (value || "")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export const excerptOf = (item: NewsRecord) => {
  const text = stripHtml(item.excerpt) || stripHtml(item.content);
  return text.length > 150 ? `${text.slice(0, 147)}...` : text || "Thông tin đang được cập nhật.";
};

export const formatNewsDate = (value?: string) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa cập nhật" : date.toLocaleDateString("vi-VN");
};
