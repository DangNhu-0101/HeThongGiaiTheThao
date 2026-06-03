import  { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Upload, Settings } from "lucide-react";
import api from "@/api/axiosConfig";

export  function SystemSettingsPage() {
    const [settings, setSettings] = useState({
        siteName: 'ITVTG HUB',
        siteSlogan: 'Admin Dashboard',
        logoUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data.success) setSettings(res.data.data);
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        void fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('siteName', settings.siteName);
            formData.append('siteSlogan', settings.siteSlogan);
            if (file) formData.append('logo', file);

            const res = await api.post('/settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.success) {
                toast.success("Đã cập nhật cài đặt hệ thống!");
                // Tùy chọn: reload hoặc update store toàn cục
            }
        } catch{
            toast.error("Lưu cài đặt thất bại.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Đang tải cấu hình...</div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
            
            <div className="flex items-center gap-2">
                <Settings className="size-8 text-sky-600" />
                <h1 className="text-3xl font-bold text-slate-900">Cài đặt hệ thống</h1>
            </div>
            
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Nhận diện thương hiệu</CardTitle>
                    <CardDescription>Tùy chỉnh logo và tên hiển thị trên thanh điều hướng của quản trị viên.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="siteName" className="font-bold">Tên hệ thống</Label>
                        <Input id="siteName" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="siteSlogan" className="font-bold">Slogan / Chú thích</Label>
                        <Input id="siteSlogan" value={settings.siteSlogan} onChange={e => setSettings({...settings, siteSlogan: e.target.value})} />
                    </div>
                    
                    <div className="space-y-3">
                        <Label className="font-bold">Logo navbar</Label>
                        <div className="flex items-center gap-6 p-4 border rounded-xl bg-slate-50/50">
                            <div className="size-20 rounded-lg border bg-white flex items-center justify-center overflow-hidden shadow-inner">
                                {file ? (
                                    <img src={URL.createObjectURL(file)} className="size-full object-contain" alt="Preview" />
                                ) : settings.logoUrl ? (
                                    <img src={`http://localhost:5001/${settings.logoUrl}`} className="size-full object-contain" alt="Current Logo" />
                                ) : (
                                    <Settings className="size-8 text-slate-300" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Button variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                                    <Upload className="size-4 mr-2" /> Thay đổi logo
                                </Button>
                                <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                                <p className="text-xs text-slate-500">Định dạng hỗ trợ: PNG, SVG, JPG. Kích thước tối ưu: 128x128px.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t bg-slate-50/50 px-6 py-4 flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700">
                        <Save className="size-4 mr-2" />
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
export default SystemSettingsPage;