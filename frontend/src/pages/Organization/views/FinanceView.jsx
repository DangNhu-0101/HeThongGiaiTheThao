import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosConfig';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const FinanceView = () => {
    const { id: tourId } = useParams();
    const [tournament, setTournament] = useState(null);
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    
    // Modal states
    const [showSponsorModal, setShowSponsorModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingSponsor, setEditingSponsor] = useState(null);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [transactionType, setTransactionType] = useState('expense'); // 'expense' or 'income'
    
    // Form data
    const [sponsorForm, setSponsorForm] = useState({
        name: '',
        amount: '',
        sponsorType: 'Gold',
        sponsorshipType: 'Money',
        website: '',
        contactPerson: { name: '', phone: '', email: '' },
        status: 'Active'
    });
    
    const [transactionForm, setTransactionForm] = useState({
        name: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Fetch tournament and sponsors
    const fetchData = async () => {
        if (!tourId) return;
        setLoading(true);
        try {
            const [tourRes, sponsorRes] = await Promise.all([
                api.get(`/tournaments/${tourId}`),
                api.get(`/sponsors/tournaments/${tourId}/sponsors`)
            ]);
            setTournament(tourRes.data.data);
            setSponsors(sponsorRes.data.data || []);
        } catch (e) {
            console.error('Lỗi lấy dữ liệu:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tourId]);

    // Tính toán các tổng
    const incomes = tournament?.incomes || [];
    const expenses = tournament?.expenses || [];
    
    const totalSponsorAmount = sponsors.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const expectedFeeRevenue = tournament?.sportsConfig?.reduce((sum, sport) => {
        return sum + (Number(sport.feeEntry || sport.feePerAthlete || 0) * Number(sport.maxTeams || 0));
    }, 0) || 0;
    
    const collectedFeeRevenue = incomes
        .filter(i => i.type === 'fee' || i.name?.toLowerCase().includes('lệ phí'))
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    
    const otherIncome = incomes
        .filter(i => i.type !== 'fee' && !i.name?.toLowerCase().includes('lệ phí'))
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    
    const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalIncome = totalSponsorAmount + collectedFeeRevenue + otherIncome;
    const balance = totalIncome - totalExpense;

    // Sponsor CRUD
    const handleAddSponsor = () => {
        setEditingSponsor(null);
        setSponsorForm({
            name: '',
            amount: '',
            sponsorType: 'Gold',
            sponsorshipType: 'Money',
            website: '',
            contactPerson: { name: '', phone: '', email: '' },
            status: 'Active'
        });
        setShowSponsorModal(true);
    };

    const handleEditSponsor = (sponsor) => {
        setEditingSponsor(sponsor);
        setSponsorForm({
            name: sponsor.name || '',
            amount: sponsor.amount || '',
            sponsorType: sponsor.sponsorType || 'Gold',
            sponsorshipType: sponsor.sponsorshipType || 'Money',
            website: sponsor.website || '',
            contactPerson: sponsor.contactPerson || { name: '', phone: '', email: '' },
            status: sponsor.status || 'Active'
        });
        setShowSponsorModal(true);
    };

    const handleSaveSponsor = async () => {
        if (!sponsorForm.name || !sponsorForm.amount) {
            alert('Vui lòng nhập tên và số tiền tài trợ');
            return;
        }

        try {
            const data = {
                ...sponsorForm,
                amount: Number(sponsorForm.amount),
                tournamentId: tourId
            };

            if (editingSponsor) {
                await api.put(`/sponsors/sponsors/${editingSponsor._id}`, data);
            } else {
                await api.post('/sponsors/sponsors', data);
            }
            fetchData();
            setShowSponsorModal(false);
        } catch (e) {
            console.error('Lỗi lưu nhà tài trợ:', e);
            alert('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    const handleDeleteSponsor = async (sponsorId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhà tài trợ này?')) return;
        try {
            await api.patch(`/sponsors/sponsors/${sponsorId}/deactivate`);
            fetchData();
        } catch (e) {
            console.error('Lỗi xóa nhà tài trợ:', e);
            alert('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    // Transaction CRUD (Income/Expense)
    const handleAddTransaction = (type) => {
        setTransactionType(type);
        setEditingTransaction(null);
        setTransactionForm({
            name: '',
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        });
        setShowTransactionModal(true);
    };

    const handleEditTransaction = (type, item) => {
        setTransactionType(type);
        setEditingTransaction(item);
        setTransactionForm({
            name: item.name || '',
            amount: item.amount || '',
            description: item.description || '',
            date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setShowTransactionModal(true);
    };

    const handleSaveTransaction = async () => {
        if (!transactionForm.name || !transactionForm.amount) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        const data = {
            ...transactionForm,
            amount: Number(transactionForm.amount),
            date: transactionForm.date ? new Date(transactionForm.date) : new Date()
        };

        try {
            if (editingTransaction) {
                await api.put(`/tournaments/${tourId}/finance/${transactionType}/${editingTransaction._id}`, data);
            } else {
                await api.post(`/tournaments/${tourId}/finance/${transactionType}`, data);
            }
            fetchData();
            setShowTransactionModal(false);
        } catch (e) {
            console.error('Lỗi lưu giao dịch:', e);
            alert('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    const handleDeleteTransaction = async (type, itemId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
        try {
            await api.delete(`/tournaments/${tourId}/finance/${type}/${itemId}`);
            fetchData();
        } catch (e) {
            console.error('Lỗi xóa giao dịch:', e);
            alert('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ color: '#018ABE', fontWeight: 800 }}>Đang tải dữ liệu...</div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .fv-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
                .fv-tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; flex-wrap: wrap; }
                .fv-tab { padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; background: #f1f5f9; color: #64748b; }
                .fv-tab.active { background: #018ABE; color: white; }
                .fv-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 32px; }
                .fv-stat-card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
                .fv-stat-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .fv-stat-value { font-size: 28px; font-weight: 800; color: #02457A; }
                .fv-stat-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }
                .fv-section { background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px; }
                .fv-section-header { padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
                .fv-section-title { font-size: 14px; font-weight: 800; color: #02457A; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
                .fv-add-btn { background: #018ABE; color: white; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
                .fv-add-btn:hover { background: #02457A; transform: translateY(-1px); }
                .fv-table { width: 100%; border-collapse: collapse; }
                .fv-table th { text-align: left; padding: 12px 16px; background: #f8fafc; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
                .fv-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                .fv-table tr:hover { background: #f8fafc; }
                .fv-amount-income { color: #10b981; font-weight: 700; }
                .fv-amount-expense { color: #ef4444; font-weight: 700; }
                .fv-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
                .fv-badge-gold { background: #fef3c7; color: #d97706; }
                .fv-badge-silver { background: #e5e7eb; color: #6b7280; }
                .fv-badge-bronze { background: #fed7aa; color: #b45309; }
                .fv-action-btn { background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 6px; font-size: 14px; transition: all 0.2s; }
                .fv-edit-btn { color: #018ABE; }
                .fv-edit-btn:hover { background: rgba(1,138,190,0.1); }
                .fv-delete-btn { color: #ef4444; }
                .fv-delete-btn:hover { background: rgba(239,68,68,0.1); }
                .fv-balance-card { background: linear-gradient(135deg, #02457A, #018ABE); border-radius: 20px; padding: 28px; text-align: center; margin-top: 24px; }
                .fv-balance-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 2px; }
                .fv-balance-amount { font-size: 42px; font-weight: 700; color: white; margin-top: 8px; }
                .fv-empty { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
                
                /* Modal */
                .fv-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .fv-modal { background: white; border-radius: 20px; width: 90%; max-width: 550px; max-height: 85vh; overflow-y: auto; }
                .fv-modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
                .fv-modal-title { font-size: 18px; font-weight: 800; color: #02457A; }
                .fv-modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }
                .fv-modal-body { padding: 24px; }
                .fv-form-group { margin-bottom: 16px; }
                .fv-form-label { display: block; font-size: 12px; font-weight: 700; color: #02457A; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
                .fv-form-input, .fv-form-select, .fv-form-textarea { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; }
                .fv-form-input:focus, .fv-form-select:focus, .fv-form-textarea:focus { outline: none; border-color: #018ABE; box-shadow: 0 0 0 3px rgba(1,138,190,0.1); }
                .fv-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .fv-modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
                .fv-btn-cancel { background: #f1f5f9; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; }
                .fv-btn-submit { background: #018ABE; color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; }
                
                @media (max-width: 768px) {
                    .fv-container { padding: 16px; }
                    .fv-stat-value { font-size: 22px; }
                    .fv-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
                    .fv-table th, .fv-table td { padding: 8px 12px; }
                }
                @media (max-width: 640px) {
                    .fv-stats-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="fv-container">
                {/* Tabs */}
                <div className="fv-tabs">
                    <button className={`fv-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Tổng quan</button>
                    <button className={`fv-tab ${activeTab === 'sponsors' ? 'active' : ''}`} onClick={() => setActiveTab('sponsors')}>🏢 Nhà tài trợ</button>
                    <button className={`fv-tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>💰 Giao dịch</button>
                </div>

                {activeTab === 'overview' && (
                    <>
                        <div className="fv-stats-grid">
                            <div className="fv-stat-card">
                                <div className="fv-stat-label">🏢 Tổng tài trợ</div>
                                <div className="fv-stat-value">{money(totalSponsorAmount)} VND</div>
                                <div className="fv-stat-sub">{sponsors.length} nhà tài trợ</div>
                            </div>
                            <div className="fv-stat-card">
                                <div className="fv-stat-label">📋 Lệ phí dự kiến</div>
                                <div className="fv-stat-value">{money(expectedFeeRevenue)} VND</div>
                                <div className="fv-stat-sub">Dựa trên số đội tối đa</div>
                            </div>
                            <div className="fv-stat-card">
                                <div className="fv-stat-label">✅ Lệ phí đã thu</div>
                                <div className="fv-stat-value">{money(collectedFeeRevenue)} VND</div>
                                <div className="fv-stat-sub">Từ các đội đã đăng ký</div>
                            </div>
                            <div className="fv-stat-card">
                                <div className="fv-stat-label">📤 Tổng chi</div>
                                <div className="fv-stat-value">{money(totalExpense)} VND</div>
                                <div className="fv-stat-sub">Đã chi tiêu</div>
                            </div>
                        </div>
                        
                        <div className="fv-balance-card">
                            <div className="fv-balance-label">Số dư hiện tại</div>
                            <div className="fv-balance-amount">{money(balance)} VND</div>
                        </div>
                    </>
                )}

                {activeTab === 'sponsors' && (
                    <div className="fv-section">
                        <div className="fv-section-header">
                            <div className="fv-section-title">🏢 Danh sách nhà tài trợ</div>
                            <button className="fv-add-btn" onClick={handleAddSponsor}>➕ Thêm nhà tài trợ</button>
                        </div>
                        {sponsors.length === 0 ? (
                            <div className="fv-empty">Chưa có nhà tài trợ nào</div>
                        ) : (
                            <table className="fv-table">
                                <thead>
                                    <tr>
                                        <th>Tên nhà tài trợ</th>
                                        <th>Loại</th>
                                        <th>Số tiền</th>
                                        <th>Người liên hệ</th>
                                        <th>Trạng thái</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sponsors.map(s => (
                                        <tr key={s._id}>
                                            <td>
                                                <strong>{s.name}</strong>
                                                {s.website && <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.website}</div>}
                                            </td>
                                            <td>
                                                <span className={`fv-badge fv-badge-${s.sponsorType?.toLowerCase() || 'gold'}`}>
                                                    {s.sponsorType || 'Gold'}
                                                </span>
                                            </td>
                                            <td className="fv-amount-income">+{money(s.amount)} VND</td>
                                            <td style={{ fontSize: 12 }}>
                                                {s.contactPerson?.name}<br/>
                                                {s.contactPerson?.phone}
                                            </td>
                                            <td>
                                                <span className="fv-badge" style={{ background: s.status === 'Active' ? '#d1fae5' : '#fee2e2', color: s.status === 'Active' ? '#059669' : '#dc2626' }}>
                                                    {s.status === 'Active' ? 'Đang hoạt động' : 'Đã dừng'}
                                                </span>
                                            </td>
                                            <td className="fv-action-btns">
                                                <button className="fv-action-btn fv-edit-btn" onClick={() => handleEditSponsor(s)}>✏️</button>
                                                <button className="fv-action-btn fv-delete-btn" onClick={() => handleDeleteSponsor(s._id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <>
                        {/* Khoản thu */}
                        <div className="fv-section">
                            <div className="fv-section-header">
                                <div className="fv-section-title">📥 Khoản thu</div>
                                <button className="fv-add-btn" onClick={() => handleAddTransaction('income')}>➕ Thêm khoản thu</button>
                            </div>
                            {incomes.length === 0 ? (
                                <div className="fv-empty">Chưa có khoản thu nào</div>
                            ) : (
                                <table className="fv-table">
                                    <thead>
                                        <tr><th>Tên khoản thu</th><th>Số tiền</th><th>Ngày</th><th>Ghi chú</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {incomes.map(item => (
                                            <tr key={item._id}>
                                                <td><strong>{item.name}</strong></td>
                                                <td className="fv-amount-income">+{money(item.amount)} VND</td>
                                                <td>{item.date ? new Date(item.date).toLocaleDateString('vi-VN') : '---'}</td>
                                                <td style={{ color: '#64748b' }}>{item.description || '---'}</td>
                                                <td>
                                                    <button className="fv-action-btn fv-edit-btn" onClick={() => handleEditTransaction('income', item)}>✏️</button>
                                                    <button className="fv-action-btn fv-delete-btn" onClick={() => handleDeleteTransaction('income', item._id)}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Khoản chi */}
                        <div className="fv-section">
                            <div className="fv-section-header">
                                <div className="fv-section-title">📤 Khoản chi</div>
                                <button className="fv-add-btn" onClick={() => handleAddTransaction('expense')}>➕ Thêm khoản chi</button>
                            </div>
                            {expenses.length === 0 ? (
                                <div className="fv-empty">Chưa có khoản chi nào</div>
                            ) : (
                                <table className="fv-table">
                                    <thead>
                                        <tr><th>Tên khoản chi</th><th>Số tiền</th><th>Ngày</th><th>Ghi chú</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map(item => (
                                            <tr key={item._id}>
                                                <td><strong>{item.name}</strong></td>
                                                <td className="fv-amount-expense">-{money(item.amount)} VND</td>
                                                <td>{item.date ? new Date(item.date).toLocaleDateString('vi-VN') : '---'}</td>
                                                <td style={{ color: '#64748b' }}>{item.description || '---'}</td>
                                                <td>
                                                    <button className="fv-action-btn fv-edit-btn" onClick={() => handleEditTransaction('expense', item)}>✏️</button>
                                                    <button className="fv-action-btn fv-delete-btn" onClick={() => handleDeleteTransaction('expense', item._id)}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Sponsor Modal */}
            {showSponsorModal && (
                <div className="fv-modal-overlay" onClick={() => setShowSponsorModal(false)}>
                    <div className="fv-modal" onClick={e => e.stopPropagation()}>
                        <div className="fv-modal-header">
                            <div className="fv-modal-title">{editingSponsor ? '✏️ Sửa nhà tài trợ' : '➕ Thêm nhà tài trợ'}</div>
                            <button className="fv-modal-close" onClick={() => setShowSponsorModal(false)}>×</button>
                        </div>
                        <div className="fv-modal-body">
                            <div className="fv-form-group">
                                <label className="fv-form-label">Tên nhà tài trợ *</label>
                                <input className="fv-form-input" value={sponsorForm.name} onChange={e => setSponsorForm({...sponsorForm, name: e.target.value})} />
                            </div>
                            <div className="fv-form-row">
                                <div className="fv-form-group">
                                    <label className="fv-form-label">Số tiền *</label>
                                    <input type="number" className="fv-form-input" value={sponsorForm.amount} onChange={e => setSponsorForm({...sponsorForm, amount: e.target.value})} />
                                </div>
                                <div className="fv-form-group">
                                    <label className="fv-form-label">Loại nhà tài trợ</label>
                                    <select className="fv-form-select" value={sponsorForm.sponsorType} onChange={e => setSponsorForm({...sponsorForm, sponsorType: e.target.value})}>
                                        <option value="Gold">Gold</option>
                                        <option value="Silver">Silver</option>
                                        <option value="Bronze">Bronze</option>
                                    </select>
                                </div>
                            </div>
                            <div className="fv-form-group">
                                <label className="fv-form-label">Website</label>
                                <input className="fv-form-input" value={sponsorForm.website} onChange={e => setSponsorForm({...sponsorForm, website: e.target.value})} />
                            </div>
                            <div className="fv-form-row">
                                <div className="fv-form-group">
                                    <label className="fv-form-label">Tên người liên hệ</label>
                                    <input className="fv-form-input" value={sponsorForm.contactPerson?.name || ''} onChange={e => setSponsorForm({...sponsorForm, contactPerson: {...sponsorForm.contactPerson, name: e.target.value}})} />
                                </div>
                                <div className="fv-form-group">
                                    <label className="fv-form-label">SĐT liên hệ</label>
                                    <input className="fv-form-input" value={sponsorForm.contactPerson?.phone || ''} onChange={e => setSponsorForm({...sponsorForm, contactPerson: {...sponsorForm.contactPerson, phone: e.target.value}})} />
                                </div>
                            </div>
                        </div>
                        <div className="fv-modal-footer">
                            <button className="fv-btn-cancel" onClick={() => setShowSponsorModal(false)}>Hủy</button>
                            <button className="fv-btn-submit" onClick={handleSaveSponsor}>{editingSponsor ? 'Cập nhật' : 'Thêm mới'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            {showTransactionModal && (
                <div className="fv-modal-overlay" onClick={() => setShowTransactionModal(false)}>
                    <div className="fv-modal" onClick={e => e.stopPropagation()}>
                        <div className="fv-modal-header">
                            <div className="fv-modal-title">
                                {editingTransaction ? '✏️ Sửa' : (transactionType === 'income' ? '➕ Thêm khoản thu' : '➕ Thêm khoản chi')}
                            </div>
                            <button className="fv-modal-close" onClick={() => setShowTransactionModal(false)}>×</button>
                        </div>
                        <div className="fv-modal-body">
                            <div className="fv-form-group">
                                <label className="fv-form-label">Tên giao dịch *</label>
                                <input className="fv-form-input" value={transactionForm.name} onChange={e => setTransactionForm({...transactionForm, name: e.target.value})} />
                            </div>
                            <div className="fv-form-group">
                                <label className="fv-form-label">Số tiền *</label>
                                <input type="number" className="fv-form-input" value={transactionForm.amount} onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})} />
                            </div>
                            <div className="fv-form-group">
                                <label className="fv-form-label">Ngày</label>
                                <input type="date" className="fv-form-input" value={transactionForm.date} onChange={e => setTransactionForm({...transactionForm, date: e.target.value})} />
                            </div>
                            <div className="fv-form-group">
                                <label className="fv-form-label">Ghi chú</label>
                                <textarea className="fv-form-textarea" value={transactionForm.description} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} rows="3" />
                            </div>
                        </div>
                        <div className="fv-modal-footer">
                            <button className="fv-btn-cancel" onClick={() => setShowTransactionModal(false)}>Hủy</button>
                            <button className="fv-btn-submit" onClick={handleSaveTransaction}>{editingTransaction ? 'Cập nhật' : 'Thêm mới'}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FinanceView;