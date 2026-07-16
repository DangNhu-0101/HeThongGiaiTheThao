import api from "@/libs/axios";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const validateImageFile = (file: File, maxSizeMb = 5) => {
  if (!allowedTypes.has(file.type)) {
    return "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP.";
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `Dung lượng ảnh tối đa ${maxSizeMb} MB.`;
  }
  return "";
};

export const uploadService = {
  validateImageFile,
  async image(file: File) {
    const error = validateImageFile(file);
    if (error) throw new Error(error);
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post<{ data: { url: string; path: string; name?: string; mimeType?: string; size?: number } }>("/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data.url;
  },
  async images(files: File[]) {
    files.forEach((file) => {
      const error = validateImageFile(file);
      if (error) throw new Error(error);
    });
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await api.post<{ data: Array<{ url: string; path: string; name: string; mimeType: string; size: number }> }>("/uploads/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
  async contactImages(files: File[]) {
    files.forEach((file) => {
      const error = validateImageFile(file);
      if (error) throw new Error(error);
    });
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await api.post<{ data: Array<{ url: string; path: string; name: string; mimeType: string; size: number }> }>("/uploads/contact-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};
