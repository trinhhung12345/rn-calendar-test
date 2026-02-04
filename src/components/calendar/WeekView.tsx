import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Platform, UIManager
} from 'react-native';
import dayjs from 'dayjs';
import { HOUR_HEIGHT, getEventLayout } from '../../utils/calendar/timeUtils';

// Kích hoạt layout animation trên Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WeekViewProps {
 selectedDateStr: string;
  eventsData: Record<string, any[]>;
  onWeekChange: (newDateStr: string) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ selectedDateStr, eventsData, onWeekChange }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [currentTime, setCurrentTime] = useState(dayjs());
  
  // Hàm tính ngày thứ hai của tuần chứa ngày được chọn
  const getMondayOfTheWeek = (dateStr: string) => {
    const selectedDayjs = dayjs(dateStr);
    let monday;
    
    // Nếu ngày được chọn là Chủ Nhật (day() = 0), thì Thứ Hai của tuần đó là 1 ngày sau
    if (selectedDayjs.day() === 0) {
      monday = selectedDayjs.startOf('day').add(1, 'day');
    } else {
      // Nếu không phải Chủ Nhật, thì Thứ Hai là ngày trong tuần - số thứ tự + 1
      const daysFromMonday = selectedDayjs.day() - 1;
      monday = selectedDayjs.subtract(daysFromMonday, 'day');
    }
    
    return monday;
  };

  // Tạo dữ liệu cho tuần duy nhất chứa ngày được chọn
  const weekDates = useMemo(() => {
    const monday = getMondayOfTheWeek(selectedDateStr);
    const weekDays = [];
    for (let j = 0; j < 7; j++) {
      weekDays.push(monday.clone().add(j, 'day'));
    }
    return weekDays;
  }, [selectedDateStr, getMondayOfTheWeek]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(dayjs()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Tính vị trí dòng thời gian hiện tại
  const currentHour = currentTime.hour();
  const currentMinute = currentTime.minute();
  const currentTopPosition = (currentHour + currentMinute / 60) * HOUR_HEIGHT;

  return (
    <View style={styles.weekViewContainer}>
      {/* --- HEADER TUẦN (FIXED, RESPONSIVE - Không scroll riêng) --- */}
      <View style={styles.weekHeader}>
        <View style={styles.weekHeaderTimePlaceholder} />
              {weekDates.map((date, index) => {
                const isSelected = date.format('YYYY-MM-DD') === selectedDateStr;
                const isToday = date.isSame(dayjs(), 'day');
                return (
                  <View key={index} style={styles.weekHeaderDay}> {/* Sử dụng flex: 1 trong styles */}
                    <Text style={[
                      styles.weekDayName, 
                      isToday && styles.weekDayNameToday
                    ]}>
                      {(date.format('dd').replace('Th', 'T') || '')}
                    </Text>
                    <Text style={[
                      styles.weekDayNumber,
                      isSelected && styles.weekDayNumberSelected,
                      isToday && styles.weekDayNumberToday
                    ]}>
                      {(date.format('D') || '')}
                    </Text>
                  </View>
                );
              })}
      </View>

      {/* --- BODY TUẦN (Chỉ Scroll Dọc) --- */}
      <ScrollView 
        style={styles.weekBodyScroll} 
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.weekBodyRow}>
          
          {/* CỘT GIỜ */}
          <View style={styles.timeColumn}>
            {hours.map((hour) => (
              <View key={hour} style={[styles.timeRowWrapper, { height: HOUR_HEIGHT }]}>
                <Text style={styles.timeLabel}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          {/* CỘT 7 NGÀY (LAYOUT FLEX RESPONSIVE) */}
          {weekDates.map((date, index) => {
            const dateStr = date.format('YYYY-MM-DD');
            const dayEvents = eventsData[dateStr] || [];
            const isToday = date.isSame(dayjs(), 'day');

            return (
              <View key={index} style={styles.weekDayColumn}>
                
                {/* 1. LƯỚI (GRID) */}
                {hours.map((hour) => (
                  <View key={hour} style={[styles.timelineRow, { height: HOUR_HEIGHT }]}>
                    {/* Đường kẻ dọc giữa các ngày */}
                    {index < 6 && <View style={styles.weekVerticalDivider} />}
                    
                    {/* Điểm giao và Đường kẻ ngang */}
                    <View style={styles.intersectDot} />
                    <View style={styles.horizontalGridLine} />
                  </View>
                ))}

                {/* 2. ĐƯỜNG GIỜ HIỆN TẠI (CHỈ HIỆN Ở NGÀY HÔM NAY) */}
                {isToday && (
                  <View 
                    style={[
                      styles.currentTimeIndicator,
                      { top: currentTopPosition }
                    ]}
                  >
                    <View style={styles.currentTimeDot} />
                    <View style={styles.currentTimeLine} />
                  </View>
                )}

                {/* 3. SỰ KIỆN (FULL TITLE) */}
                {dayEvents.map((event, idx) => {
                  if (!event.time) return null;
                  
                  const { top, height } = getEventLayout(event.time);
                  const visualTop = top + 4.5;
                  const visualHeight = height - 9;

                  if (visualHeight <= 0) return null;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayEventCard,
                        styles.weekEventCard, 
                        { top: visualTop, height: visualHeight }
                      ]}
                      activeOpacity={0.9}
                    >
                      {/* Full Title */}
                      <Text style={styles.weekEventTitle}>Phiên tuần</Text>
                      <Text style={styles.weekEventSub}>{event.time}</Text>
                      <Text style={styles.weekEventLocation}>{event.location}</Text>
                    </TouchableOpacity>
                  );
                })}

              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};


export default WeekView;

const styles = StyleSheet.create({
  weekViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Page cho mỗi tuần trong swipe view
  weekPage: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Header Tuần
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    paddingVertical: 2, // Khoảng cách header
    backgroundColor: '#fff',
    zIndex: 10,
    elevation: 1,
  },
  weekHeaderTimePlaceholder: {
    width: 60, // Cố định cột giờ
  },
  weekHeaderDay: {
    flex: 1, // QUAN TRỌNG: Tự động chia đều chiều rộng cho 7 ngày
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1, 
    borderRightColor: '#f0f0f0',
  },
  weekDayName: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600',
    marginBottom: 4,
  },
  weekDayNameToday: {
    color: '#359EFF',
  },
  weekDayNumber: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  weekDayNumberSelected: {
    color: '#359EFF',
    fontWeight: 'bold',
  },
  weekDayNumberToday: {
    backgroundColor: '#e6f7ff',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 28, 
  },

  // Body Tuần
  weekBodyScroll: {
    flex: 1,
  },
  weekBodyRow: {
    flexDirection: 'row',
    flex: 1, // Chiếm hết chiều cao còn lại
  },
  
  // Cột ngày trong Week View
  weekDayColumn: {
    flex: 1, // QUAN TRỌNG: Tự động chia đều chiều rộng cho 7 ngày
    position: 'relative',
  },
  
  // Đường kẻ dọc ngăn cách các ngày
  weekVerticalDivider: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#e5e5ea',
    zIndex: 0,
  },

  // --- STYLE CHO EVENT TRONG WEEK VIEW ---
  weekEventCard: {
    // Sử dụng left/right nhỏ vì cột giờ hẹp
    left: 2, 
    right: 2, 
    paddingVertical: 4,
    paddingHorizontal: 2,
    justifyContent: 'center',
    // Bỏ borderLeft để tiết kiệm chỗ khi cột hẹp
  },
  weekEventTitle: {
    color: '#fff',
    fontSize: 10, // Chữ vừa vặn flex layout
    fontWeight: 'bold',
    marginBottom: 1,
  },
  weekEventSub: {
    color: '#fff',
    fontSize: 10,
    fontWeight:'bold', 
    marginBottom: 1,
  },
  weekEventLocation: {
    color: '#fff',
    fontSize: 10, 
    fontWeight:'bold',
  },
  
  // Các style chung cho cả DayView và WeekView
  timeColumn: {
    width: 60, 
    marginTop: -4, // Kéo lên chút để căn chỉnh visual cho khớp với line
  },
  timeRowWrapper: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start', // Căn lề trên để gần với đường kẻ
    alignItems: 'flex-end',
    paddingTop: 0, // Khoảng cách từ top xuống text
    paddingRight: 8,
  },
  timeLabel: {
    fontSize: 11,
    color: '#8e8e93', // Màu xá hơi đậm giống iOS
    textAlign: 'right',
    fontWeight: '600',
    lineHeight: 15, // Điều chỉnh chiều cao dòng
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Căn đầu dòng để đường kẻ nằm trên cùng
    position: 'relative',
  },
  verticalAxisLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1, 
    backgroundColor: '#e5e5ea',
    zIndex: 0,
  },
  intersectDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e5e5ea',
    marginLeft: -2.5, // Căn giữa đường kẻ dọc
    marginTop: -2.5, // Căn giữa đường kẻ ngang (nếu line dày 1 thì marginTop -2.5 là vừa)
    zIndex: 1,
  },
  horizontalGridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5ea', 
    marginLeft: 4, 
    zIndex: 0,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2, // Chiều cao tổng cộng để chứa đường và dot
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10, // Nằm trên cùng
  },
  currentTimeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#359EFF', // Màu xanh theo yêu cầu
    borderWidth: 2,
    borderColor: '#fff',
    marginLeft: -5, // Căn giữa đường kẻ dọc
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#359EFF',
    marginLeft: 2, // Khoảng cách nhỏ từ chấm tròn
  },
  dayEventCard: {
    position: 'absolute',
    left: 8, 
    right: 12,
    // Sử dụng backgroundColor hơi trong suốt hoặc đậm tùy ý, đây là màu đậm
    backgroundColor: '#359EFF', 
    borderRadius: 6,
    // Padding nội dung
    paddingVertical: 6,
    paddingHorizontal: 8,
    // Viền bên trái nổi bật
    // borderLeftWidth: 4, 
    // borderLeftColor: '#1565C0', 
    zIndex: 5, // Nằm dưới current time, trên grid
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  dayEventTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dayEventLocation: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    opacity: 0.9,
  },
});