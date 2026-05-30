// Định nghĩa các loại môn thi đấu (Mapper cho Category)
export const SPORT_CATEGORIES = {
  MS: 'Đơn Nam',
  WS: 'Đơn Nữ',
  MD: 'Đôi Nam',
  WD: 'Đôi Nữ',
  XD: 'Đôi Nam Nữ'
};

// Trạng thái của Team
export const TEAM_STATUS = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  CONFIRMED: 'confirmed',
  PLAYING: 'playing',
  ELIMINATED: 'eliminated',
  CHAMPION: 'champion'
};

// Trạng thái thành viên
export const MEMBER_STATUS = {
  INVITED: 'Invited',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  ACTIVE: 'Active'
};