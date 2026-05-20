import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const IMAGE_BASE_URL = "http://localhost:5001/";

const TournamentsList = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, ongoing, completed
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
      case 'completed': return 'Đã kết thúc';
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Đang cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredTournaments = tournaments.filter(tournament => {
    // Lọc theo status
    if (filter !== 'all' && tournament.status !== filter) return false;
    
    // Lọc theo search term
    if (searchTerm && !tournament.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const handleTournamentClick = (tournamentId) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  return (
    <>
      <style>{`
        .tournaments-page {
          min-height: 100vh;
          background: var(--bg-light);
          font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif;
        }

        .tournaments-hero {
          background: linear-gradient(160deg, var(--ocean-deep) 0%, var(--ocean-mid) 100%);
          padding: 60px 24px 50px;
          text-align: center;
          position: relative;
        }

        .tournaments-hero h1 {
          font-size: clamp(28px, 6vw, 48px);
          font-weight: 700;
          color: #fff;
          margin-bottom: 16px;
        }

        .tournaments-hero p {
          font-size: 16px;
          color: var(--ocean-pale);
          max-width: 600px;
          margin: 0 auto;
        }

        .tournaments-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        /* Filter Bar */
        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
          background: var(--bg-white);
          padding: 20px 24px;
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
          transform: translateY(-1px);
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
          background: var(--bg-white);
        }

        .search-input:focus {
          border-color: var(--ocean-mid);
          box-shadow: 0 0 0 3px rgba(1, 138, 190, 0.1);
        }

        /* Tournament Grid */
        .tournaments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }

        @media (max-width: 768px) {
          .tournaments-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Tournament Card */
        .tournament-card {
          background: var(--bg-white);
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(2, 69, 122, 0.08);
          border: 1px solid rgba(1, 138, 190, 0.12);
        }

        .tournament-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 35px rgba(2, 69, 122, 0.15);
          border-color: var(--ocean-mid);
        }

        .tournament-banner {
          position: relative;
          height: 180px;
          overflow: hidden;
          background: linear-gradient(135deg, var(--ocean-deep), var(--ocean-mid));
        }

        .tournament-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .tournament-card:hover .tournament-banner img {
          transform: scale(1.05);
        }

        .tournament-status {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          backdrop-filter: blur(8px);
        }

        .status-upcoming {
          background: rgba(255, 193, 7, 0.9);
          color: #856404;
        }

        .status-ongoing {
          background: rgba(40, 167, 69, 0.9);
          color: #155724;
        }

        .status-completed {
          background: rgba(108, 117, 125, 0.9);
          color: #1e2a3a;
        }

        .status-default {
          background: rgba(1, 138, 190, 0.9);
          color: white;
        }

        .tournament-content {
          padding: 20px;
        }

        .tournament-name {
          font-size: 20px;
          font-weight: 800;
          color: var(--ocean-deep);
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .tournament-slogan {
          font-size: 13px;
          color: var(--ocean-mid);
          margin-bottom: 16px;
          font-style: italic;
        }

        .tournament-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(1, 138, 190, 0.1);
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #5a6a7a;
        }

        .info-icon {
          width: 28px;
          font-size: 14px;
        }

        .info-text {
          flex: 1;
        }

        .sports-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .sport-badge {
          background: var(--sky-mist);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: var(--ocean-deep);
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

        /* Loading Skeleton */
        .skeleton-card {
          background: var(--bg-white);
          border-radius: 20px;
          overflow: hidden;
        }

        .skeleton-banner {
          height: 180px;
          background: linear-gradient(90deg, #dce8ee 25%, #c4d8e2 50%, #dce8ee 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        .skeleton-content {
          padding: 20px;
        }

        .skeleton-title {
          height: 24px;
          width: 80%;
          margin-bottom: 12px;
        }

        .skeleton-text {
          height: 16px;
          width: 60%;
          margin-bottom: 8px;
        }

        @keyframes shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }

        .skeleton {
          background: linear-gradient(90deg, #dce8ee 25%, #c4d8e2 50%, #dce8ee 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }
      `}</style>

      <div className="tournaments-page">
        {/* Hero Section */}
        <div className="tournaments-hero">
          <h1>🏆 CÁC GIẢI ĐẤU</h1>
          <p>Khám phá và tham gia các giải đấu pickleball hấp dẫn nhất</p>
        </div>

        <div className="tournaments-container">
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

          {/* Tournament Grid */}
          {isLoading ? (
            <div className="tournaments-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-banner" />
                  <div className="skeleton-content">
                    <div className="skeleton-title skeleton" />
                    <div className="skeleton-text skeleton" />
                    <div className="skeleton-text skeleton" style={{ width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏓</div>
              <h3>Không tìm thấy giải đấu</h3>
              <p>Hiện tại chưa có giải đấu nào phù hợp với tiêu chí của bạn.</p>
            </div>
          ) : (
            <div className="tournaments-grid">
              {filteredTournaments.map(tournament => (
                <div 
                  key={tournament._id} 
                  className="tournament-card"
                  onClick={() => handleTournamentClick(tournament._id)}
                >
                  <div className="tournament-banner">
                    {tournament.banners?.[0] ? (
                      <img 
                        src={IMAGE_BASE_URL + tournament.banners[0].replace(/\\/g, '/').replace(/^\/+/, '')} 
                        alt={tournament.name}
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '48px'
                      }}>
                        🏆
                      </div>
                    )}
                    <span className={`tournament-status ${getStatusClass(tournament.status)}`}>
                      {getStatusText(tournament.status)}
                    </span>
                  </div>
                  
                  <div className="tournament-content">
                    <h3 className="tournament-name">{tournament.name}</h3>

                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TournamentsList;