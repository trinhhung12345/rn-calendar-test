import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Platform, UIManager
} from 'react-native';
import dayjs from 'dayjs';
import { HOUR_HEIGHT, getEventLayout, parseTimeToMinutes } from '../../utils/calendar/timeUtils';

// Kích hoạt layout animation trên Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DayViewProps {
 dateStr: string;
  events: any[];
}

const DayView: React.FC<DayViewProps> = ({ dateStr, events }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Cập nhật thời gian mỗi phút
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Tính vị trí đường hiện tại
  const currentHour = currentTime.hour();
  const currentMinute = currentTime.minute();
  const currentTopPosition = (currentHour + currentMinute / 60) * HOUR_HEIGHT;

  return (
    <ScrollView 
      style={styles.dayViewContainer} 
      contentContainerStyle={{ paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.dayViewBody}>
        
        {/* --- CỘT GIỜ (TRÁI) --- */}
        <View style={styles.timeColumn}>
          {hours.map((hour) => (
            <View key={hour} style={[styles.timeRowWrapper, { height: HOUR_HEIGHT }]}>
              <Text style={styles.timeLabel}>
                {hour.toString().padStart(2, '0')}:00
              </Text>
            </View>
          ))}
        </View>

        {/* --- CỘT TIMELINE (PHẢI) --- */}
        <View style={styles.timelineColumn}>
          
          {/* 1. LƯỚI NỀN (GRID) */}
          {hours.map((hour) => (
            <View key={hour} style={[styles.timelineRow, { height: HOUR_HEIGHT }]}>
              {/* Đường kẻ dọc (Trục) */}
              <View style={styles.verticalAxisLine} />
              
              {/* Chấm tròn giao điểm */}
              <View style={styles.intersectDot} />
              
              {/* Đường kẻ ngang (Căn ở top = 0 để align với label giờ) */}
              <View style={styles.horizontalGridLine} />
            </View>
          ))}

          {/* 2. ĐƯỜNG GIỜ HIỆN TẠI (CURRENT TIME) */}
          <View 
            style={[
              styles.currentTimeIndicator,
              { top: currentTopPosition }
            ]}
          >
            <View style={styles.currentTimeDot} />
            <View style={styles.currentTimeLine} />
          </View>

          {/* 3. SỰ KIỆN (EVENTS) - Có chỉnh chiều cao để cách đường kẻ 9px */}
          {events && events.map((event, index) => {
            // Lấy vị trí gốc
            const { top, height } = getEventLayout(event.time);
            
            // TÍNH TOÁN LẠI VỊ TRÍ & CHIỀU CAO
            // Trừ đi 9px tổng (4.5px trên + 4.5px dưới) để tạo khoảng cách với các đường kẻ ngang
            const visualTop = top + 4.5; 
            const visualHeight = height - 9;

            // Nếu chiều cao sau khi trừ còn dương thì mới render (tránh lỗi layout)
            if (visualHeight <= 0) return null;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayEventCard,
                  { 
                    top: visualTop, 
                    height: visualHeight 
                  }
                ]}
                activeOpacity={0.9}
              >
                <Text style={styles.dayEventTitle}>Phần tuân: {event.time}</Text>
                <Text style={styles.dayEventLocation}>{event.location}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </ScrollView>
  );
};


export default DayView;

const styles = StyleSheet.create({
  dayViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dayViewBody: {
    flexDirection: 'row',
  },
  
  // --- CỘT GIỜ (BÊN TRÁI) ---
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

  // --- CỘT TIMELINE (BÊN PHẢI) ---
  timelineColumn: {
    flex: 1,
    position: 'relative', // Quan trọng để absolute current time và events
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Căn đầu dòng để đường kẻ nằm trên cùng
    position: 'relative',
  },

  // 1. Đường kẻ dọc (Trục Y)
  verticalAxisLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1, 
    backgroundColor: '#e5e5ea',
    zIndex: 0,
  },

  // 2. Chấm tròn giao điểm (Intersection Dot)
  intersectDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e5e5ea',
    marginLeft: -2.5, // Căn giữa đường kẻ dọc
    marginTop: -2.5, // Căn giữa đường kẻ ngang (nếu line dày 1 thì marginTop -2.5 là vừa)
    zIndex: 1,
  },

  // 3. Đường kẻ ngang (Grid Line)
  horizontalGridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5ea', 
    marginLeft: 4, 
    zIndex: 0,
  },

  // --- ĐƯỜNG HIỆN TẠI (CURRENT TIME INDICATOR) ---
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2, // Chiều cao tổng cộng để chứa đường và dot
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10, // Nằm trên cùng
  },

  // Chấm tròn màu xanh tại vị trí hiện tại
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

  // Đường kẻ ngang màu xanh từ chấm tròn
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#359EFF',
    marginLeft: 2, // Khoảng cách nhỏ từ chấm tròn
  },

  // --- EVENT CARD (GIỮ NGUYÊN NHƯNG ĐIỀU CHỈNH VỊ TRÍ) ---
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