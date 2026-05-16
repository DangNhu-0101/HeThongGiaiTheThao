import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosConfig';

const UserListView = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users/all')
            .then(res => setUsers(res.data.data))
            .finally(() => setLoading(false));
    }, []);

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
                    .ul-header {
                        padding: 20px;
                    }
                }

                @media (max-width: 640px) {
                    .ul-header {
                        padding: 16px;
                    }
                }

                .ul-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #02457A;
                    margin-bottom: 8px;
                }

                @media (max-width: 640px) {
                    .ul-title {
                        font-size: 1.25rem;
                    }
                }

                .ul-subtitle {
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .ul-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .ul-table thead {
                    background: #02457A;
                    color: #fff;
                }

                .ul-table th {
                    padding: 20px 30px;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                @media (max-width: 768px) {
                    .ul-table th {
                        padding: 16px 20px;
                    }
                }

                @media (max-width: 640px) {
                    .ul-table thead {
                        display: none;
                    }
                }

                .ul-table td {
                    padding: 20px 30px;
                    border-bottom: 1px solid #e2e8f0;
                }

                @media (max-width: 768px) {
                    .ul-table td {
                        padding: 16px 20px;
                    }
                }

                @media (max-width: 640px) {
                    .ul-table tbody tr {
                        display: block;
                        margin-bottom: 16px;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 16px;
                    }

                    .ul-table td {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 0;
                        border-bottom: 1px solid #f1f5f9;
                    }

                    .ul-table td:last-child {
                        border-bottom: none;
                    }

                    .ul-table td::before {
                        content: attr(data-label);
                        font-weight: 700;
                        color: #02457A;
                        font-size: 0.7rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        min-width: 100px;
                    }
                }

                .ul-user-name {
                    font-weight: 800;
                    color: #02457A;
                }

                .ul-user-username {
                    font-size: 0.7rem;
                    color: #64748b;
                }

                .ul-user-email {
                    color: #334155;
                }

                .ul-user-phone {
                    color: #14b8a6;
                    font-weight: 700;
                }

                .ul-role-badge {
                    background: #e2e8f0;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #02457A;
                    display: inline-block;
                }

                @media (max-width: 640px) {
                    .ul-role-badge {
                        padding: 4px 10px;
                        font-size: 0.65rem;
                    }
                }
            `}</style>

            <div className="ul-container">
                <div className="ul-header">
                    <h2 className="ul-title">👥 QUẢN LÝ NGƯỜI DÙNG</h2>
                    <p className="ul-subtitle">Danh sách hội viên toàn hệ thống.</p>
                </div>
                <table className="ul-table">
                    <thead>
                        <tr>
                            <th>HỘI VIÊN</th>
                            <th>LIÊN HỆ</th>
                            <th>VAI TRÒ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td data-label="HỘI VIÊN">
                                    <div className="ul-user-name">{u.displayName}</div>
                                    <div className="ul-user-username">@{u.username}</div>
                                </td>
                                <td data-label="LIÊN HỆ">
                                    <div className="ul-user-email">{u.email}</div>
                                    <div className="ul-user-phone">{u.phone || "Chưa có SĐT"}</div>
                                </td>
                                <td data-label="VAI TRÒ">
                                    <span className="ul-role-badge">{u.role}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default UserListView;