import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig'; // Đảm bảo đường dẫn này đúng với project của bạn

const CourtView = () => {
    const { id: tourId } = useParams();
    const [courts, setCourts] = useState([]);
    const [newCourtName, setNewCourtName] = useState("");
    const [selectedSports, setSelectedSports] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

    const availableSports = ['Pickleball', 'Tennis', 'Badminton', 'Table Tennis', 'Football', 'Volleyball'];

    const fetchCourts = async () => {
        try {
            console.log("📥 Đang lấy sân cho tournament:", tourId);
            const res = await api.get(`/courts/tournament/${tourId}`);
            console.log("✅ API Response:", res.data);
            setCourts(res.data.data || []);
            console.log(`📊 Tìm thấy ${res.data.data?.length || 0} sân`);
        } catch (e) { 
            console.error("❌ Lỗi lấy danh sách sân:", e); 
        }
    };

    useEffect(() => { 
        if (tourId) fetchCourts(); 
    }, [tourId]);

    const handleSportToggle = (sport) => {
        setSelectedSports(prev => 
            prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
        );
    };

    const handleAddCourt = async (e) => {
        e.preventDefault();
        if (!newCourtName.trim() || selectedSports.length === 0) return alert("Vui lòng nhập tên và chọn môn!");
        
        try {
            await api.post('/courts/add', { 
                name: newCourtName, 
                tournamentId: tourId, 
                sportTypes: selectedSports,
                status: 'empty' 
            });
            setNewCourtName("");
            setSelectedSports([]);
            setIsAdding(false);
            fetchCourts();
        } catch (e) { 
            alert("Lỗi: " + (e.response?.data?.message || "Không thể thêm sân mới!")); 
        }
    };

    const toggleCourtStatus = async (id, currentStatus) => {
        if (currentStatus === 'busy') return alert("Sân đang có trận đấu!");
        const nextStatus = currentStatus === 'inactive' ? 'empty' : 'inactive';
        try {
            await api.patch(`/courts/${id}/status`, { status: nextStatus });
            fetchCourts();
        } catch (e) { alert("Lỗi cập nhật trạng thái!"); }
    };

    const handleDeleteCourt = async (id, name) => {
        if (!window.confirm(`Xóa sân [${name}]?`)) return;
        try {
            await api.delete(`/courts/${id}`);
            fetchCourts();
        } catch (e) { alert("Lỗi khi xóa sân!"); }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">🏟️ QUẢN LÝ SÂN THI ĐẤU</h2>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-black text-white px-4 py-2 rounded">
                    {isAdding ? "HỦY" : "+ THÊM SÂN"}
                </button>
            </div>

            {isAdding && (
                <div className="bg-gray-50 p-4 rounded mb-6 border-2 border-dashed">
                    <form onSubmit={handleAddCourt}>
                        <input className="w-full p-2 mb-4 border rounded" placeholder="Tên sân..." 
                               value={newCourtName} onChange={e => setNewCourtName(e.target.value)} />
                        <div className="flex flex-wrap gap-2 mb-4"> Môn thi đấu:
                            {availableSports.map(s => (
                                <button key={s} type="button" onClick={() => handleSportToggle(s)}
                                    className={`px-3 py-1 rounded text-xs ${selectedSports.includes(s) ? 'bg-lime-400' : 'bg-gray-200'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button type="submit" className="w-full bg-lime-500 py-2 font-bold rounded">LƯU SÂN</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {courts.map(c => (
                    <div key={c._id} className="border p-4 rounded shadow-sm">
                        <div className="flex justify-between">
                            <span className="font-bold text-lg">{c.name}</span>
                            <button onClick={() => handleDeleteCourt(c._id, c.name)}>🗑️</button>
                        </div>
                        <div className="text-xs text-blue-600 mb-2">{c.sportTypes?.join(', ')}</div>
                        <div className={`text-sm mb-4 ${c.status === 'empty' ? 'text-green-500' : 'text-red-500'}`}>
                            ● {c.status === 'empty' ? 'Sẵn sàng' : 'Tạm ngưng'}
                        </div>
                        <button onClick={() => toggleCourtStatus(c._id, c.status)} 
                                className="w-full py-1 bg-gray-100 rounded text-xs uppercase font-bold">
                            {c.status === 'inactive' ? "Mở lại" : "Tạm đóng"}
                        </button>
                    </div>
                ))}
            </div>
        </div>      
    );
};

export default CourtView;