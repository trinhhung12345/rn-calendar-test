import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, StatusBar, ViewStyle, TextStyle } from 'react-native';
import { Calendar, ICalendarEventBase } from 'react-native-big-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { Ionicons } from '@expo/vector-icons'; // Sử dụng icon từ Expo
import { generateDummyEvents } from '@utils/dummyData';

// Define types
interface CustomEvent extends ICalendarEventBase {
  color?: string;
}

type Direction = 'prev' | 'next';

// Cấu hình tiếng Việt
dayjs.locale('vi');

const CalendarScreen = () => {
  // State lưu ngày hiện tại đang xem (mặc định là hôm nay)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // State lưu sự kiện
  const [events, setEvents] = useState<CustomEvent[]>([]);
  
  // State chế độ xem: 3 ngày, tuần, tháng
  const [mode, setMode] = useState<'week' | '3days' | 'month'>('week'); 

  useEffect(() => {
    // Load dữ liệu giả khi vào màn hình
    setEvents(generateDummyEvents());
  }, []);

  // --- LOGIC ĐIỀU HƯỚNG ---
  
  // Hàm chuyển ngày khi bấm nút mũi tên
  const changeDate = (direction: Direction) => {
    const date = dayjs(selectedDate);
    let newDate;
    
    // Cập nhật logic: Nếu đang ở chế độ Tháng thì cộng/trừ 1 tháng
    if (mode === 'month') {
      newDate = direction === 'next' ? date.add(1, 'month') : date.subtract(1, 'month');
    } else if (mode === 'week') {
      newDate = direction === 'next' ? date.add(1, 'week') : date.subtract(1, 'week');
    } else {
      // 3days
      newDate = direction === 'next' ? date.add(3, 'day') : date.subtract(3, 'day');
    }
    
    setSelectedDate(newDate.toDate());
  };

  // Hàm xử lý khi người dùng vuốt trên lịch (Swipe)
  const handleSwipeEnd = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePressEvent = (event: CustomEvent) => {
    alert(`Sự kiện: ${event.title}\nThời gian: ${dayjs(event.start).format('HH:mm')} - ${dayjs(event.end).format('HH:mm')}`);
  };

  // --- GIAO DIỆN HEADER ---
  
  const renderHeader = () => {
    const headerText = dayjs(selectedDate).locale('vi').format('[Tháng] MM, YYYY');
    
    // Chỉ hiện khoảng ngày (ví dụ 12-18) khi KHÔNG PHẢI là chế độ tháng
    const weekRangeText = mode !== 'month' 
      ? `${dayjs(selectedDate).startOf('week').format('DD')} - ${dayjs(selectedDate).endOf('week').format('DD')}`
      : 'Toàn bộ tháng'; // Text hiển thị khi ở chế độ tháng

    return (
      <View style={styles.headerContainer}>
        {/* Dòng 1: Tiêu đề tháng và nút điều hướng */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{headerText}</Text>
            <Text style={styles.subTitle}>{weekRangeText}</Text>
          </View>
          
          <View style={styles.navigationControls}>
            <TouchableOpacity onPress={() => changeDate('prev')} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setSelectedDate(new Date())} style={styles.todayBtn}>
               <Text style={styles.todayText}>Hôm nay</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => changeDate('next')} style={styles.iconBtn}>
              <Ionicons name="chevron-forward" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dòng 2: Tabs chuyển chế độ */}
        <View style={styles.modeSelector}>
            <TouchableOpacity 
              style={[styles.modeBtn, mode === '3days' && styles.modeBtnActive]} 
              onPress={() => setMode('3days')}
            >
              <Text style={[styles.modeText, mode === '3days' && styles.modeTextActive]}>3 Ngày</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeBtn, mode === 'week' && styles.modeBtnActive]} 
              onPress={() => setMode('week')}
            >
              <Text style={[styles.modeText, mode === 'week' && styles.modeTextActive]}>Tuần</Text>
            </TouchableOpacity>

            {/* Thêm nút Tháng */}
            <TouchableOpacity 
              style={[styles.modeBtn, mode === 'month' && styles.modeBtnActive]} 
              onPress={() => setMode('month')}
            >
              <Text style={[styles.modeText, mode === 'month' && styles.modeTextActive]}>Tháng</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#000000" />
      
      {renderHeader()}
      
      <Calendar
        events={events}
        height={600}
        mode={mode}
        
        // QUAN TRỌNG: Truyền ngày đang chọn vào đây
        date={selectedDate} 
        
        // QUAN TRỌNG: Cập nhật state khi vuốt
        onSwipeEnd={handleSwipeEnd} 
        
        hourRowHeight={50}
        ampm={true}
        onPressEvent={handlePressEvent}
        eventCellStyle={(event) => ({
            backgroundColor: event.color || '#4285F4',
            borderRadius: 4,
            borderColor: '#fff', 
            borderWidth: 1,
            // Ở chế độ tháng, ô rất nhỏ, có thể cần chỉnh minHeight
            minHeight: mode === 'month' ? 20 : undefined 
        })}
        // Style cho header ngày (Thứ 2, Thứ 3...)
        headerContainerStyle={{ borderBottomColor: '#eee', borderBottomWidth: 1 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight || 0,
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2, // Shadow cho Android
    shadowColor: '#000', // Shadow cho iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202124',
  },
  subTitle: {
    fontSize: 14,
    color: '#5f6368',
    marginTop: 2,
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 50,
  },
  todayBtn: {
    marginHorizontal: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
  },
  todayText: {
    fontSize: 14,
    color: '#3c4043',
    fontWeight: '500',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    padding: 2,
    alignSelf: 'flex-start',
  },
  modeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  modeBtnActive: {
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  modeText: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
  },
  modeTextActive: {
    color: '#1a73e8', // Google Blue text
    fontWeight: '600',
  },
});

export default CalendarScreen;