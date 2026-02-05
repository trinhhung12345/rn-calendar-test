import React, { useMemo, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView
} from 'react-native';
import dayjs from 'dayjs';
import { ExtendedCalendarEvent } from '../../utils/patrolSessionToEvent';
import EventDetailModal from '../calendar/EventDetailModal';

// Type alias for backward compatibility
type CalendarEvent = ExtendedCalendarEvent;

interface MonthViewProps { 
  currentMonth: string, 
  selectedDateStr: string, 
  eventsData: Record<string, CalendarEvent[]>, 
  onDayPress: (dateStr: string) => void,
  onMonthChange: (dateStr: string) => void
}

const MonthView: React.FC<MonthViewProps> = ({ 
  currentMonth, 
  selectedDateStr, 
  eventsData, 
  onDayPress,
  onMonthChange
}) => {
  // 1. Cấu hình tên thứ (T2 - CN)
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  
  // State for modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // 2. Tính toán dữ liệu lưới lịch
  const generateGrid = () => {
    const startOfMonth = dayjs(currentMonth).startOf('month');
    const endOfMonth = dayjs(currentMonth).endOf('month');
    
    // Lấy ngày trong tuần của ngày đầu tiên (0: CN, 1: T2, ..., 6: T7)
    let startDay: number = startOfMonth.day(); 
    // Điều chỉnh để T2 là ngày đầu tiên của tuần (nếu startDay = 0 (CN) -> 6, nếu > 0 -> -1)
    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = endOfMonth.date();
    const gridData: any[] = [];

    // Thêm ngày của tháng trước (để lưới đầy đủ)
    const prevMonthDays = startOfMonth.subtract(1, 'day').date();
    for (let i = startDay - 1; i >= 0; i--) {
      gridData.push({
        dayNum: prevMonthDays - i,
        type: 'prev',
        dateStr: startOfMonth.subtract(startDay - i, 'day').format('YYYY-MM-DD')
      });
    }

    // Thêm ngày của tháng hiện tại
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = startOfMonth.date(i).format('YYYY-MM-DD');
      gridData.push({
        dayNum: i,
        type: 'current',
        dateStr: dateStr,
        events: eventsData[dateStr] || []
      });
    }

    // Thêm ngày của tháng sau (để đủ 6 hàng - 42 ô cho đẹp giống ảnh)
    const remainingCells = 42 - gridData.length;
    for (let i = 1; i <= remainingCells; i++) {
      gridData.push({
        dayNum: i,
        type: 'next',
        dateStr: endOfMonth.add(i, 'day').format('YYYY-MM-DD')
      });
    }

    return gridData;
  };

  const daysGrid = generateGrid();

  const handleEventPress = (event: CalendarEvent) => {
    if (event.originalSession) {
      setSelectedEvent(event);
      setModalVisible(true);
    }
  };

  return (
    <>
      <View style={styles.monthViewContainer}>
        {/* --- THANH CHỌN THÁNG (CHIPS) --- */}
        <View style={styles.monthChipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
               const isActive = dayjs(currentMonth).month() + 1 === month;
               return (
                 <TouchableOpacity 
                    key={month} 
                    style={[
                      styles.chipBtn, 
                      isActive && styles.chipBtnActive
                    ]} 
                    onPress={() => {
                      // Tính lại date string dựa trên tháng được chọn
                      const newDateStr = dayjs(currentMonth).month(month - 1).format('YYYY-MM-DD');
                      onMonthChange(newDateStr);
                    }}
                 >
                   <Text style={[styles.chipText, isActive && styles.chipTextActive]}>Thg {month}</Text>
                 </TouchableOpacity>
               )
            })}
          </ScrollView>
        </View>

        {/* --- HEADER TUẦN (T2 - CN) --- */}
        <View style={styles.monthWeekHeader}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.monthWeekHeaderItem}>
              <Text style={styles.monthWeekHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* --- LƯỚI LỊCH (6 HÀNG) --- */}
        <View style={styles.monthGrid}>
          {daysGrid.map((item, index) => {
            const isSelected = item.dateStr === selectedDateStr;
            const isToday = item.dateStr === dayjs().format('YYYY-MM-DD');
            const isCurrentMonth = item.type === 'current';

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthDayCell,
                  !isCurrentMonth && styles.monthDayCellOtherMonth,
                  isSelected && styles.monthDayCellSelected
                ]}
                onPress={() => onDayPress(item.dateStr)}
                activeOpacity={0.7}
              >
                {/* Số ngày */}
                <View style={styles.monthDayNumberWrapper}>
                  <Text style={[
                    styles.monthDayNumber,
                    !isCurrentMonth && styles.monthDayNumberOtherMonth,
                    isToday && styles.monthDayNumberToday,
                    isSelected && styles.monthDayNumberSelected
                  ]}>
                    {item.dayNum}
                  </Text>
                </View>

                {/* HIỂN THỊ SỰ KIỆN (CHỈ HIỆN Ở THÁNG HIỆN TẠI) */}
                {isCurrentMonth && item.events && item.events.length > 0 && (
                  <View style={styles.monthEventContainer}>
                    {item.events.slice(0, 2).map((evt: CalendarEvent, evtIdx: number) => (
                  <TouchableOpacity 
                    key={evtIdx} 
                    style={styles.monthEventBox}
                    onPress={() => handleEventPress(evt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.monthEventText} numberOfLines={1}>
                      {evt.title}
                    </Text>
                  </TouchableOpacity>
                    ))}
                    {item.events.length > 2 && (
                      <Text style={styles.monthMoreEvents}>+{item.events.length - 2}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {selectedEvent?.originalSession && (
        <EventDetailModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          eventName={selectedEvent.originalSession.name}
          startTime={selectedEvent.originalSession.planStartTime}
          endTime={selectedEvent.originalSession.planEndTime}
          patrolLogs={selectedEvent.originalSession.patrolLogs}
        />
      )}
    </>
  );
};

export default MonthView;

const styles = StyleSheet.create({
  monthViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  monthChipsWrapper: {
    paddingHorizontal: 16, // Khoảng cách ngang
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginTop: -15,
    marginBottom: 10
  },
  monthWeekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  monthWeekHeaderItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthWeekHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e8e93', // Màu xám nhẹ giống iOS
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 5,
  },
  monthDayCell: {
    width: '14.28%', // 100% / 7 ngày
    height: 100, // Chiều cao cố định để chứa event
    borderWidth: 0.5,
    borderColor: '#f0f0f0',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  monthDayCellOtherMonth: {
    backgroundColor: '#FAFAFA', // Nền xám rất nhạt cho ngày khác tháng
  },
  monthDayCellSelected: {
    backgroundColor: '#E6F7FF', // Nền xanh nhạt khi được chọn
    borderColor: '#1890FF',
  },
  monthDayNumberWrapper: {
    marginBottom: 4,
  },
  monthDayNumber: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  monthDayNumberOtherMonth: {
    color: '#ccc',
  },
  monthDayNumberToday: {
    color: '#1890FF',
    fontWeight: 'bold',
  },
  monthDayNumberSelected: {
    color: '#1890FF',
  },
  
  // Event trong ô tháng
  monthEventContainer: {
    width: '90%',
    alignItems: 'center',
  },
  monthEventBox: {
    width: '100%',
    backgroundColor: '#359EFF', // Màu xanh giống ảnh
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginBottom: 2,
    alignItems: 'center',
  },
  monthEventText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  monthMoreEvents: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  chipBtn: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 16, marginRight: 8, backgroundColor: '#F5F5F5',
  },
  chipBtnActive: { borderColor: '#1890FF', backgroundColor: '#E6F7FF' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#666' },
  chipTextActive: { color: '#1890FF', fontWeight: '700' },
});
