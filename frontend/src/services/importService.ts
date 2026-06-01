import api from "@/api/axiosConfig";

export const importService = {
  downloadTemplate: async (activeTab: string) => {
    const response = await api.get(`/xlsx/template/${activeTab}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_${activeTab}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportData: async (activeTab: string) => {
    const response = await api.get(`/xlsx/export/${activeTab}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_export_${activeTab}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  upload: (formData: FormData) => api.post('/xlsx/import', formData),
};
