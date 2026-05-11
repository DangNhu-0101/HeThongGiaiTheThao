// frontend/src/components/ImportPlayers.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/axiosConfig';

const ImportPlayers = ({ teamId, onRefresh }) => {
    const [fileData, setFileData] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            const workbook = XLSX.read(event.target.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);
            
            // Map lại dữ liệu theo đúng key Backend yêu cầu
            const formattedData = data.map(row => ({
                email: row['Email'] || row['email'],
                displayName: row['Họ Tên'] || row['name']
            }));
            setFileData(formattedData);
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        if (fileData.length === 0) return alert("Vui lòng chọn file hợp lệ!");
        
        setLoading(true);
        try {
            const res = await api.post('/teams/import-players', {
                teamId,
                playersList: fileData
            });
            alert(res.data.message);
            setFileData([]);
            if (onRefresh) onRefresh(); // Load lại danh sách thành viên
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi import");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <h3 className="font-bold mb-2 text-forest">📥 IMPORT THÀNH VIÊN TỪ EXCEL</h3>
            <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lime-100 file:text-forest"
            />
            
            {fileData.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm mb-2 text-blue-600">Tìm thấy {fileData.length} cầu thủ trong file.</p>
                    <button 
                        onClick={handleImport}
                        disabled={loading}
                        className="bg-forest text-white px-4 py-2 rounded-lg font-bold w-full"
                    >
                        {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN IMPORT"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImportPlayers;