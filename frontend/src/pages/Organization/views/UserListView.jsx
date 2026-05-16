import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosConfig';

const UserListView = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users')
            .then(res => {
                console.log("Users data:", res.data);
                setUsers(res.data?.data || res.data || []);
            })
            .catch(err => console.error("Lỗi lấy users:", err))
            .finally(() => setLoading(false));
    }, []);

    const roleLabels = {
        'player': 'Vận động viên',
        'Player': 'Vận động viên',
        'referee': 'Trọng tài',
        'Referee': 'Trọng tài',
        'Organization': 'Ban tổ chức',
        'organization': 'Ban tổ chức',
        'coach': 'Huấn luyện viên',
    };

    const genderLabels = {
        'male': 'Nam',
        'female': 'Nữ',
        'other': 'Khác',
    };

    if (loading) return <div style={{textAlign:'center',padding:60,color:'#018ABE',fontWeight:700,fontSize:18}}>Đang tải danh sách...</div>;

    return (
        <>
            <style>{`
                .ul-container {
                    background: #fff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .ul-header {
                    padding: 30px;
                    border-bottom: 1px solid #e2e8f0;
                }

                @media (max-width: 768px) {
                    .ul-header { padding: 20px; }
                }

                @media (max-width: 640px) {
                    .ul-header { padding: 16px; }
                }

                .ul-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #02457A;
                    margin-bottom: 8px;
                }

                @media (max-width: 640px) {
                    .ul-title { font-size: 1.25rem; }
                }

                .ul-subtitle {
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .ul-table-wrap {
                    overflow-x: auto;
                }

                .ul-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 800px;
                }

                .ul-table thead {
                    background: #02457A;
                    color: #fff;
                }

                .ul-table th {
                    padding: 16px 20px;
                    text-align: left;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    white-space: nowrap;
                }

                @media (max-width: 768px) {
                    .ul-table th { padding: 12px 14px; font-size: 0.65rem; }
                }

                @media (max-width: 640px) {
                    .ul-table thead { display: none; }
                    .ul-table, .ul-table tbody, .ul-table tr, .ul-table td { display: block; }
                    .ul-table tr {
                        margin-bottom: 16px;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 16px;
                        background: #fff;
                    }
                    .ul-table td {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 0;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .ul-table td:last-child { border-bottom: none; }
                    .ul-table td::before {
                        content: attr(data-label);
                        font-weight: 700;
                        color: #02457A;
                        font-size: 0.65rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        min-width: 100px;
                    }
                }

                .ul-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 0.875rem;
                }

                .ul-user-name {
                    font-weight: 800;
                    color: #02457A;
                    font-size: 0.9rem;
                }

                .ul-user-username {
                    font-size: 0.7rem;
                    color: #64748b;
                    margin-top: 2px;
                }

                .ul-user-email {
                    color: #334155;
                }

                .ul-user-phone {
                    color: #14b8a6;
                    font-weight: 600;
                    font-size: 0.8rem;
                }

                .ul-role-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .ul-role-player { background: #e0f2fe; color: #0369a1; }
                .ul-role-referee { background: #fef3c7; color: #b45309; }
                .ul-role-organization { background: #fce7f3; color: #be185d; }
                .ul-role-coach { background: #d1fae5; color: #065f46; }

                .ul-gender-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.65rem;
                    font-weight: 600;
                }

                .ul-gender-male { background: #e0f2fe; color: #0369a1; }
                .ul-gender-female { background: #fce7f3; color: #be185d; }
                .ul-gender-other { background: #f1f5f9; color: #64748b; }

                .ul-level {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    background: #d1fae5;
                    color: #065f46;
                    margin-left: 6px;
                }

                .ul-status-active { color: #16a34a; font-weight: 600; }
                .ul-status-inactive { color: #dc2626; font-weight: 600; }
                .ul-status-banned { color: #9333ea; font-weight: 600; }
            `}</style>

            <div className="ul-container">
                <div className="ul-header">
                    <h2 className="ul-title">👥 QUẢN LÝ NGƯỜI DÙNG</h2>
                    <p className="ul-subtitle">Danh sách hội viên toàn hệ thống ({users.length} người).</p>
                </div>
                <div className="ul-table-wrap">
                    <table className="ul-table">
                        <thead>
                            <tr>
                                <th>Hội viên</th>
                                <th>Giới tính</th>
                                <th>Level</th>
                                <th>Liên hệ</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{textAlign:'center',padding:40,color:'#94a3b8'}}>
                                        Chưa có người dùng nào.
                                    </td>
                                </tr>
                            ) : (
                                users.map(u => {
                                    const roleKey = (u.role || '').toLowerCase();
                                    return (
                                        <tr key={u._id}>
                                            <td data-label="Hội viên">
                                                <div className="ul-user-name">{u.name || u.username}</div>
                                                <div className="ul-user-username">@{u.username}</div>
                                            </td>
                                            <td data-label="Giới tính">
                                                <span className={`ul-gender-badge ul-gender-${u.gender || 'other'}`}>
                                                    {genderLabels[u.gender] || '—'}
                                                </span>
                                            </td>
                                            <td data-label="Level">
                                                {u.level ? (
                                                    <span className="ul-level">{u.level}</span>
                                                ) : (
                                                    <span style={{color:'#94a3b8',fontSize:'0.8rem'}}>—</span>
                                                )}
                                            </td>
                                            <td data-label="Liên hệ">
                                                <div className="ul-user-email">{u.email}</div>
                                                <div className="ul-user-phone">{u.phoneNumber || "Chưa có SĐT"}</div>
                                            </td>
                                            <td data-label="Vai trò">
                                                <span className={`ul-role-badge ul-role-${roleKey}`}>
                                                    {roleLabels[u.role] || u.role}
                                                </span>
                                            </td>
                                            <td data-label="Trạng thái">
                                                <span className={`ul-status-${u.playerStatus || u.status || 'active'}`}>
                                                    {u.playerStatus || u.status || 'active'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default UserListView;