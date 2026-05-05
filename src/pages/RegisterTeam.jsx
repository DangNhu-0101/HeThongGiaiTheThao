import React, { useState } from 'react';
import api from '../api/axiosConfig';

const RegisterTeam = () => {
    const [teamName, setTeamName] = useState("");
    const [tournamentId, setTournamentId] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/teams/createTeam', { teamName, tournamentId });
            alert("Tạo đội bóng thành công! Hãy mời đồng đội vào nhé.");
            setTeamName("");
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi tạo đội!");
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', padding: '30px', background: '#fff', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', color: '#16a34a' }}>CỘT MỐC ĐẦU TIÊN: LẬP ĐỘI</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                <div>
                    <label style={{ fontWeight: 'bold' }}>Tên Đội Của Bạn:</label>
                    <input 
                        type="text" required value={teamName} onChange={(e) => setTeamName(e.target.value)}
                        placeholder="VD: Mãnh Hổ FC"
                        style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>
                <div>
                    <label style={{ fontWeight: 'bold' }}>Mã Giải Đấu (ID):</label>
                    <input 
                        type="text" required value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}
                        placeholder="Nhập mã giải đấu do BTC cung cấp"
                        style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>
                <button type="submit" style={{ padding: '12px', background: '#16a34a', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                     TẠO ĐỘI NGAY
                </button>
            </form>
        </div>
    );
};

export default RegisterTeam;