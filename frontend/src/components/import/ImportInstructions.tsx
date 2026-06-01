import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export const ImportInstructions: React.FC = () => {
  return (
    <Card className="bg-slate-50 border-slate-200 h-full">
      <CardHeader className="pb-3 flex flex-row items-center gap-2 space-y-0">
        <Info className="h-5 w-5 text-sky-600" />
        <CardTitle className="text-md font-bold text-slate-800">Lưu ý khi import</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-3 leading-relaxed">
          <li>Sử dụng đúng <strong>file mẫu</strong> do hệ thống cung cấp cho từng loại dữ liệu.</li>
          <li>Không thay đổi tên các cột (Header) trong file Excel.</li>
          <li>Dữ liệu tại các cột bắt buộc không được để trống.</li>
          <li>Hệ thống sẽ kiểm tra tính hợp lệ (Validate) trước khi lưu chính thức.</li>
          <li>Nếu có lỗi, hệ thống sẽ chỉ rõ vị trí <strong>Sheet</strong> và <strong>Dòng</strong> bị sai.</li>
        </ul>
      </CardContent>
    </Card>
  );
};