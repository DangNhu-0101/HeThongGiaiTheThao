import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const Notifications = () => {
  // Dữ liệu giả lập để bạn test UI (Sau này sẽ fetch từ Backend)
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'PAYMENT', // Loại: Yêu cầu thanh toán
      title: ' Lập đội thành công!',
      message: 'Đội "Duy Hưng - Minh Tú" đã được tạo. Vui lòng thanh toán lệ phí để Ban tổ chức duyệt đội lên danh sách chính thức.',
      amount: 500000,
      teamName: 'Duy Hưng - Minh Tú',
      isRead: false,
      date: 'Vừa xong'
    },
    {
      id: '2',
      type: 'INVITATION', // Loại: Lời mời tham gia đội
      title: '📩 Lời mời vào đội',
      message: 'Trần Quí Tuấn đã mời bạn tham gia đội "Quí Tuấn - Mạnh Hùng" thi đấu tại Giải Mùa Hè 2024.',
      teamId: 'team_abc123',
      isRead: false,
      date: '2 giờ trước'
    },
    {
      id: '3',
      type: 'SYSTEM', // Loại: Thông báo hệ thống bình thường
      title: ' Chào mừng đến với giải đấu',
      message: 'Hồ sơ Vận động viên của bạn đã được cập nhật thành công. Chúc bạn có một mùa giải bùng nổ!',
      isRead: true,
      date: '1 ngày trước'
    }
  ]);

  const [activeQR, setActiveQR] = useState(null); // Quản lý việc hiển thị mã QR

  // --- Xử lý Lời mời (Chấp nhận / Từ chối) ---
  const handleInvite = async (notifId, action) => {
    try {
      // Giả lập gọi API
      // await api.post(`/api/teams/invitations/${notifId}/${action}`);
      
      alert(action === 'accept' ? '🎉 Chúc mừng bạn đã gia nhập đội!' : 'Đã từ chối lời mời.');
      
      // Đánh dấu đã đọc hoặc xóa khỏi danh sách
      setNotifications(notifications.filter(n => n.id !== notifId));
    } catch (error) {
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
      <div className="flex-between" style={{ marginBottom: '30px' }}>
        <h1 className="text-forest" style={{ fontSize: '2.5rem', margin: 0 }}> Thông Báo Của Bạn</h1>
        <button style={{ background: 'none', border: 'none', color: 'var(--teal-accent)', cursor: 'pointer', fontWeight: 'bold' }}>
          Đánh dấu tất cả là đã đọc
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className="card" 
            style={{ 
              padding: '25px', 
              position: 'relative',
              borderLeft: notif.type === 'PAYMENT' ? '6px solid var(--brick-red)' : 
                          notif.type === 'INVITATION' ? '6px solid var(--teal-accent)' : 
                          '6px solid var(--primary-lime)',
              opacity: notif.isRead ? 0.7 : 1
            }}
          >
            {/* Chấm đỏ báo chưa đọc */}
            {!notif.isRead && (
              <div style={{ position: 'absolute', top: '20px', right: '20px', width: '12px', height: '12px', background: 'var(--brick-red)', borderRadius: '50%' }}></div>
            )}

            <h3 style={{ margin: '0 0 10px 0', color: 'var(--dark-forest)', fontSize: '1.3rem' }}>{notif.title}</h3>
            <p style={{ color: '#555', fontSize: '1.05rem', lineHeight: '1.5', marginBottom: '15px' }}>{notif.message}</p>
            <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '20px' }}> {notif.date}</div>

            {/* --- NẾU LÀ THÔNG BÁO LỜI MỜI VÀO ĐỘI --- */}
            {notif.type === 'INVITATION' && (
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={() => handleInvite(notif.id, 'accept')}
                  className="auth-button" 
                 style={{ margin: 0, flex: 1, background: 'var(--dark-forest)', color: '#f5f5f5'}}

                >
                   ĐỒNG Ý GIA NHẬP
                </button>
                <button 
                  onClick={() => handleInvite(notif.id, 'reject')}
                  className="auth-button" 
                  style={{ margin: 0, flex: 1, background: '#f5f5f5', color: '#555', border: '1px solid #ddd' }}
                >
                  TỪ CHỐI
                </button>
              </div>
            )}

            {/* --- NẾU LÀ THÔNG BÁO THANH TOÁN QR LẬP ĐỘI --- */}
            {notif.type === 'PAYMENT' && (
              <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', border: '1px dashed #ccc' }}>
                <div className="flex-between" style={{ marginBottom: activeQR === notif.id ? '20px' : '0' }}>
                  <div className="fw-bold" style={{ fontSize: '1.2rem' }}>
                    Lệ phí tham gia: <span style={{ color: 'var(--brick-red)' }}>{notif.amount.toLocaleString()} VNĐ</span>
                  </div>
                  <button 
                    onClick={() => setActiveQR(activeQR === notif.id ? null : notif.id)}
                    style={{ background: 'var(--teal-accent)', color: 'white', padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {activeQR === notif.id ? 'Đóng QR' : ' Hiện Mã QR Thanh Toán'}
                  </button>
                </div>

                {/* KHU VỰC MÃ QR */}
                {activeQR === notif.id && (
                  <div className="flex-center" style={{ flexDirection: 'column', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                    <p style={{ color: '#666', marginBottom: '15px' }}>Sử dụng App Ngân hàng hoặc Momo để quét mã này. Hệ thống sẽ tự động nhập số tiền và nội dung.</p>
                    
                   
                    <div style={{ background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                      <img 
                        src={`https://img.vietqr.io/image/mbbank-0912345678-compact.png?amount=${notif.amount}&addInfo=Thanh toan phi giai dau doi ${notif.teamName}&accountName=BAN TO CHUC PTSC`} 
                        alt="QR Thanh Toán" 
                        style={{ width: '250px', height: '250px' }}
                      />
                    </div>
                    
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#555' }}>
                      <strong>Nội dung CK:</strong> Thanh toan phi giai dau doi {notif.teamName}<br/>
                      Sau khi chuyển khoản, Admin sẽ duyệt đội của bạn trong vòng 24h.
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center text-muted" style={{ padding: '50px' }}>
            <h2> Không có thông báo nào</h2>
            <p>Mọi thứ đang rất yên tĩnh!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
