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
  async image(file: File) {
    const error = validateImageFile(file);
    if (error) throw new Error(error);
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post<{ data: { url: string; path: string } }>("/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data.url;
  },
};
