import { Dimensions } from 'react-native';

export const HOUR_HEIGHT = 60; // Chiều cao của 1 ô giờ (60px)
export const START_HOUR = 0;   // Bắt đầu từ 00:00
export const END_HOUR = 24;    // Kết thúc lúc 24:00

// Hàm chuyển đổi giờ "HH:mm" thành phút (từ 0h)
export const parseTimeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [hourStr, minuteStr] = timeStr.split(':');
  return parseInt(hourStr) * 60 + parseInt(minuteStr);
};

// Hàm lấy thông tin vị trí từ chuỗi thời gian "06:0 - 09:00"
export const getEventLayout = (timeRangeStr: string) => {
  // timeRangeStr ví dụ: "06:00 - 09:00"
  const [startStr, endStr] = timeRangeStr.split(' - ');
  
  const startMinutes = parseTimeToMinutes(startStr);
  const endMinutes = parseTimeToMinutes(endStr);
  
  // Tính top: (số phút / 60) * chiều cao 1 giờ
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  
  // Tính height: ((phút kết thúc - phút bắt đầu) / 60) * chiều cao 1 giờ
  const durationMinutes = endMinutes - startMinutes;
  const height = (durationMinutes / 60) * HOUR_HEIGHT;

  return { top, height };
};

export const windowWidth = Dimensions.get('window').width;