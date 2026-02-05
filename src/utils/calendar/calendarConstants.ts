// Dữ liệu mẫu
export const MOCK_EVENTS: Record<string, any[]> = {};

// Chế độ xem
export const VIEW_MODES = [
  { key: 'schedule', label: 'Lịch biểu' },
  { key: 'day', label: 'Ngày' },
 { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
];

export interface CalendarEvent {
  id: string;
  time: string;
  location: string;
  title?: string;
}
