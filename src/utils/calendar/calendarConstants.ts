// Dữ liệu mẫu
export const MOCK_EVENTS: Record<string, any[]> = {
  '2026-02-02': [{ id: 1, time: '06:00 - 09:00', location: 'Khu vực: A - Số điểm: 12' }],
  '2026-02-03': [
    { id: 2, time: '06:00 - 09:00', location: 'Khu vực: B - Số điểm: 10' },
    { id: 3, time: '14:00 - 16:00', location: 'Khu vực: C - Số điểm: 8' }
  ],
  '2026-02-1': [{ id: 4, time: '14:00 - 16:00', location: 'Khu vực: A - Số điểm: 12' }],
  '2026-02-14': [{ id: 5, time: '10:00 - 12:00', location: 'Khu vực: D - Số điểm: 15' }],
};

// Chế độ xem
export const VIEW_MODES = [
  { key: 'schedule', label: 'Lịch biểu' },
  { key: 'day', label: 'Ngày' },
 { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
];