export const MATCH_STATUS_TAGS = [
  { value: 'pending', label: 'Chưa diễn ra', tone: 'muted', resultLocked: false },
  { value: 'live', label: 'Đang diễn ra', tone: 'danger', resultLocked: false },
  { value: 'paused', label: 'Tam hoan', tone: 'warning', resultLocked: false },
  { value: 'cancelled', label: 'Huy', tone: 'danger', resultLocked: true },
  { value: 'completed', label: 'Đã hoàn thành', tone: 'success', resultLocked: true },
  { value: 'forfeited', label: 'Bo cuoc', tone: 'danger', resultLocked: true },

];

export const MATCH_STATUS_VALUES = MATCH_STATUS_TAGS.map((status) => status.value);

export const getMatchStatusTag = (value) => MATCH_STATUS_TAGS.find((status) => status.value === value) || MATCH_STATUS_TAGS[0];
