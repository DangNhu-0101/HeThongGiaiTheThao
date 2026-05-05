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
        <div className="modern-card" style={{ padding: 0 }}>
            <div style={{ padding: '30px' }}>
                <h2 className="text-forest">👥 QUẢN LÝ NGƯỜI DÙNG</h2>
                <p className="text-muted">Danh sách hội viên toàn hệ thống.</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--dark-forest)', color: 'white' }}>
                    <tr>
                        <th style={{ padding: '20px 30px', textAlign: 'left' }}>HỘI VIÊN</th>
                        <th style={{ textAlign: 'left' }}>LIÊN HỆ</th>
                        <th style={{ textAlign: 'left' }}>VAI TRÒ</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u._id} className="table-row">
                            <td style={{ padding: '20px 30px' }} className="fw-black text-forest">
                                {u.displayName} <br/> <small>@{u.username}</small>
                            </td>
                            <td>
                                <div>{u.email}</div>
                                <div style={{color:'var(--teal-accent)', fontWeight:'bold'}}>{u.phone || "Chưa có SĐT"}</div>
                            </td>
                            <td><span className="admin-badge">{u.role}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserListView;