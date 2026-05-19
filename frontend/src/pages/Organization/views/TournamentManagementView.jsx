import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/axiosConfig';
import TournamentModal from '../components/TournamentModal';

const IMAGE_BASE_URL = "http://localhost:5001/";

const TournamentManagementView = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tournaments');
      const data = response.data?.data || response.data || [];
      setTournaments(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách giải đấu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming': return 'Sắp diễn ra';
      case 'ongoing': return 'Đang diễn ra';
      case 'completed': return 'Đã kết thút';
      default: return 'Đang cập nhật';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'upcoming': return 'status-upcoming';
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      default: return 'status-default';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'upcoming': return 'badge-warning';
      case 'ongoing': return 'badge-success';
      case 'completed': return 'badge-secondary';
      default: return 'badge-info';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Đang cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (filter !== 'all' && tournament.status !== filter) return false;
    if (searchTerm && !tournament.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleCreateTournament = () => {
    setModalMode('create');
    setSelectedTournamentId(null);
    setShowModal(true);
  };

  const handleEditTournament = (id) => {
    setModalMode('edit');
    setSelectedTournamentId(id);
    setShowModal(true);
  };

  const handleDeleteTournament = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa giải đấu "${name}"? Hành động này không thể hoàn tác.`)) {
      try {
        await api.delete(`/tournaments/${id}`);
        alert('Xóa giải đấu thành công!');
        fetchTournaments();
      } catch (error) {
        console.error('Lỗi khi xóa giải đấu:', error);
        alert(error.response?.data?.message || 'Không thể xóa giải đấu. Vui lòng thử lại sau.');
      }
    }
  };

  const handleViewTournament = (id) => {
    navigate(`/admin/tournament/${id}`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTournamentId(null);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    fetchTournaments();
  };

  const getSportCount = (sportsConfig) => {
    return sportsConfig?.length || 0;
  };

  const getTeamCount = (tournament) => {
    return tournament.registeredTeams?.length || tournament.teams?.length || 0;
  };

  return (
    <>
      <style>{`
        .tournament-management {
          padding: 24px;
          background: var(--bg-light);
          min-height: 100vh;
        }

        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 32px;
        }

        .management-title h1 {
          font-size: 28px;
          color: var(--ocean-deep);
          margin-bottom: 8px;
        }

        .management-title p {
          color: #5a6a7a;
          font-size: 14px;
        }

        .btn-create {
          background: linear-gradient(90deg, var(--ocean-deep), var(--ocean-mid));
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(1, 138, 190, 0.3);
        }

        /* Filter Bar */
        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          background: var(--bg-white);
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(2, 69, 122, 0.08);
        }

        .filter-tabs {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1.5px solid var(--ocean-pale);
          background: var(--bg-white);
          color: var(--ocean-deep);
        }

        .filter-tab.active {
          background: var(--ocean-mid);
          border-color: var(--ocean-mid);
          color: white;
        }

        .filter-tab:hover:not(.active) {
          background: var(--sky-mist);
        }

        .search-box {
          flex: 1;
          max-width: 300px;
        }

        .search-input {
          width: 100%;
          padding: 10px 16px;
          border: 1.5px solid var(--ocean-pale);
          border-radius: 30px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: var(--ocean-mid);
          box-shadow: 0 0 0 3px rgba(1, 138, 190, 0.1);
        }

        /* Stats Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--bg-white);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          border: 1px solid rgba(1, 138, 190, 0.1);
          transition: all 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(2, 69, 122, 0.1);
        }

        .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: var(--ocean-mid);
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 13px;
          color: #5a6a7a;
          font-weight: 600;
        }

        /* Tournament Table */
        .tournament-table {
          background: var(--bg-white);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(1, 138, 190, 0.1);
        }

        .table-header {
          display: grid;
          grid-template-columns: 60px 2fr 1fr 1fr 1fr 100px 120px;
          background: var(--ocean-deep);
          color: white;
          padding: 16px 20px;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .table-row {
          display: grid;
          grid-template-columns: 60px 2fr 1fr 1fr 1fr 100px 120px;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(1, 138, 190, 0.08);
          align-items: center;
          transition: background 0.2s;
        }

        .table-row:hover {
          background: var(--sky-mist);
        }

        @media (max-width: 1024px) {
          .table-header, .table-row {
            grid-template-columns: 50px 1.5fr 1fr 0.8fr 0.8fr 80px 100px;
            font-size: 12px;
            gap: 8px;
          }
        }

        @media (max-width: 768px) {
          .table-header, .table-row {
            display: none;
          }
          
          .mobile-card {
            display: block;
          }
        }

        .tournament-name {
          font-weight: 700;
          color: var(--ocean-deep);
          margin-bottom: 4px;
        }

        .tournament-slogan {
          font-size: 11px;
          color: #9aadba;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge-success {
          background: rgba(40, 167, 69, 0.15);
          color: #28a745;
        }

        .badge-warning {
          background: rgba(255, 193, 7, 0.15);
          color: #ffc107;
        }

        .badge-secondary {
          background: rgba(108, 117, 125, 0.15);
          color: #6c757d;
        }

        .badge-info {
          background: rgba(1, 138, 190, 0.15);
          color: var(--ocean-mid);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-view {
          background: var(--ocean-mid);
          color: white;
        }

        .btn-view:hover {
          background: var(--ocean-deep);
        }

        .btn-edit {
          background: var(--purple-accent);
          color: white;
        }

        .btn-edit:hover {
          background: #8b7bc8;
        }

        .btn-delete {
          background: var(--logo-red);
          color: white;
        }

        .btn-delete:hover {
          background: #a00012;
        }

        /* Mobile Card View */
        .mobile-card {
          display: none;
          background: var(--bg-white);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid rgba(1, 138, 190, 0.1);
        }

        @media (max-width: 768px) {
          .mobile-card {
            display: block;
          }
        }

        .mobile-card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }

        .mobile-card-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--ocean-deep);
        }

        .mobile-card-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(1, 138, 190, 0.1);
        }

        .mobile-info-item {
          font-size: 12px;
        }

        .mobile-info-label {
          color: #9aadba;
          margin-right: 8px;
        }

        .mobile-info-value {
          color: var(--ocean-deep);
          font-weight: 600;
        }

        .mobile-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--bg-white);
          border-radius: 20px;
        }

        .empty-state-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          color: var(--ocean-deep);
          margin-bottom: 12px;
        }

        .empty-state p {
          color: #7a8fa0;
        }

        /* Skeleton */
        .skeleton-row {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(1, 138, 190, 0.08);
        }

        .skeleton {
          background: linear-gradient(90deg, #dce8ee 25%, #c4d8e2 50%, #dce8ee 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }

        @keyframes shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
      `}</style>

      <div className="tournament-management">
        {/* Header */}
        <div className="management-header">
          <div className="management-title">
            <h1>🏆 Quản lý giải đấu</h1>
            <p>Tạo, chỉnh sửa và quản lý các giải đấu của bạn</p>
          </div>
          <button className="btn-create" onClick={handleCreateTournament}>
            ➕ Tạo giải đấu mới
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{tournaments.length}</div>
            <div className="stat-label">Tổng số giải đấu</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{tournaments.filter(t => t.status === 'upcoming').length}</div>
            <div className="stat-label">Sắp diễn ra</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{tournaments.filter(t => t.status === 'ongoing').length}</div>
            <div className="stat-label">Đang diễn ra</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{tournaments.filter(t => t.status === 'completed').length}</div>
            <div className="stat-label">Đã kết thúc</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tất cả
            </button>
            <button 
              className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              Sắp diễn ra
            </button>
            <button 
              className={`filter-tab ${filter === 'ongoing' ? 'active' : ''}`}
              onClick={() => setFilter('ongoing')}
            >
              Đang diễn ra
            </button>
            <button 
              className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Đã kết thúc
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Tìm kiếm giải đấu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tournament Table - Desktop */}
        <div className="tournament-table">
          <div className="table-header">
            <div>STT</div>
            <div>Tên giải đấu</div>
            <div>Thời gian</div>
            <div>Môn thi đấu</div>
            <div>Số đội</div>
            <div>Trạng thái</div>
            <div>Thao tác</div>
          </div>

          {isLoading ? (
            // Loading skeletons
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-row">
                <div className="skeleton" style={{ height: 20, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: '80%' }} />
              </div>
            ))
          ) : filteredTournaments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏓</div>
              <h3>Không tìm thấy giải đấu</h3>
              <p>Hiện tại chưa có giải đấu nào phù hợp với tiêu chí của bạn.</p>
              <button className="btn-create" style={{ marginTop: 20 }} onClick={handleCreateTournament}>
                ➕ Tạo giải đấu đầu tiên
              </button>
            </div>
          ) : (
            filteredTournaments.map((tournament, index) => (
              <div key={tournament._id} className="table-row">
                <div>{index + 1}</div>
                <div>
                  <div className="tournament-name">{tournament.name}</div>
                  {tournament.slogan && <div className="tournament-slogan">{tournament.slogan}</div>}
                </div>
                <div style={{ fontSize: 12 }}>
                  {formatDate(tournament.timeLine?.tournamentStart)}
                </div>
                <div>
                  <span className="status-badge badge-info">
                    {getSportCount(tournament.sportsConfig)} môn
                  </span>
                </div>
                <div>{getTeamCount(tournament)} đội</div>
                <div>
                  <span className={`status-badge ${getStatusBadgeClass(tournament.status)}`}>
                    {getStatusText(tournament.status)}
                  </span>
                </div>
                <div>
                  <div className="action-buttons">
                    <button 
                      className="action-btn btn-view"
                      onClick={() => handleViewTournament(tournament._id)}
                    >
                      Xem
                    </button>
                    <button 
                      className="action-btn btn-edit"
                      onClick={() => handleEditTournament(tournament._id)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="action-btn btn-delete"
                      onClick={() => handleDeleteTournament(tournament._id, tournament.name)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Cards */}
        {!isLoading && filteredTournaments.map((tournament, index) => (
          <div key={tournament._id} className="mobile-card">
            <div className="mobile-card-header">
              <div>
                <div className="mobile-card-title">{tournament.name}</div>
                {tournament.slogan && <div style={{ fontSize: 11, color: '#9aadba' }}>{tournament.slogan}</div>}
              </div>
              <span className={`status-badge ${getStatusBadgeClass(tournament.status)}`}>
                {getStatusText(tournament.status)}
              </span>
            </div>
            <div className="mobile-card-info">
              <div className="mobile-info-item">
                <span className="mobile-info-label">📅 Thời gian:</span>
                <span className="mobile-info-value">{formatDate(tournament.timeLine?.tournamentStart)}</span>
              </div>
              <div className="mobile-info-item">
                <span className="mobile-info-label">🏅 Môn thi đấu:</span>
                <span className="mobile-info-value">{getSportCount(tournament.sportsConfig)} môn</span>
              </div>
              <div className="mobile-info-item">
                <span className="mobile-info-label">👥 Số đội:</span>
                <span className="mobile-info-value">{getTeamCount(tournament)} đội</span>
              </div>
              <div className="mobile-info-item">
                <span className="mobile-info-label">📍 Địa điểm:</span>
                <span className="mobile-info-value">{tournament.location || 'Đang cập nhật'}</span>
              </div>
            </div>
            <div className="mobile-actions">
              <button className="action-btn btn-view" onClick={() => handleViewTournament(tournament._id)}>
                Xem chi tiết
              </button>
              <button className="action-btn btn-edit" onClick={() => handleEditTournament(tournament._id)}>
                Chỉnh sửa
              </button>
              <button className="action-btn btn-delete" onClick={() => handleDeleteTournament(tournament._id, tournament.name)}>
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tournament Modal */}
      {showModal && (
        <TournamentModal
          mode={modalMode}
          tourId={selectedTournamentId}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
};

export default TournamentManagementView;