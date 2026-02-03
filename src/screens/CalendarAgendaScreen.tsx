import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
 View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, StatusBar, ScrollView, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Giả sử bạn dùng icon check, nếu không có lucide thì dùng Ionicons thay thế
import { Ionicons as IconSet } from '@expo/vector-icons'; 
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// ... (Giữ nguyên phần config LocaleConfig và dayjs như cũ) ...
LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6','Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'],
  dayNames: ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';
dayjs.locale('vi');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ... (Giữ nguyên MOCK_EVENTS và VIEW_MODES) ...
const MOCK_EVENTS: Record<string, any[]> = {
  '2026-02-02': [{ id: 1, time: '06:00 - 09:00', location: 'Khu vực: A - Số điểm: 12' }],
  '2026-02-03': [
    { id: 2, time: '06:00 - 09:00', location: 'Khu vực: B - Số điểm: 10' },
    { id: 3, time: '14:00 - 16:00', location: 'Khu vực: C - Số điểm: 8' }
  ],
  '2026-02-1': [{ id: 4, time: '14:00 - 16:00', location: 'Khu vực: A - Số điểm: 12' }],
  '2026-02-14': [{ id: 5 }],
};

const VIEW_MODES = [
  { key: 'schedule', label: 'Lịch biểu' },
  { key: 'day', label: 'Ngày' },
 { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
];

// ====================================================================
// 1. TỐI ƯU HÓA: Tách Component con và dùng React.memo
// Component này chỉ render lại khi props (isSelected, isToday, item) thay đổi
// ====================================================================
const AgendaItem = React.memo(({ item, isSelected, isToday }: any) => {
  const { dayNum, dayOfWeek, events } = item;

  return (
    <View style={styles.rowWrapper}>
      <View style={styles.itemContainer}>
        {/* CỘT TRÁI */}
        <View style={styles.leftColumn}>
          <View style={[styles.dateCircle, isSelected && styles.dateCircleActive]}>
            <Text style={[styles.dateNumber, isSelected && styles.dateNumberActive]}>
              {dayNum}
            </Text>
          </View>
          <Text style={[styles.dayOfWeekText, isSelected && styles.dayOfWeekTextActive]}>
            {dayOfWeek}
          </Text>
        </View>

        {/* CỘT PHẢI */}
        <View style={styles.rightColumn}>
          {events ? events.map((event: any, index: number) => (
              <View key={index} style={styles.eventCard}>
                <Text style={styles.eventTextTitle}>Phiên tuần: {event.time}</Text>
                <Text style={styles.eventTextLocation}>{event.location}</Text>
              </View>
            )) : <Text style={styles.emptyText}>Không có lịch tuần</Text>}
        </View>
      </View>

      {/* GẠCH CHÂN */}
      {isToday ? (
        <View style={styles.todaySeparatorContainer}>
           <View style={styles.todayDot} />
           <View style={styles.todayLine} />
        </View>
      ) : (
        <View style={styles.separatorLine} />
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom Comparison Function (Tùy chọn, để đảm bảo performance tối đa)
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isToday === nextProps.isToday &&
    prevProps.item.dateStr === nextProps.item.dateStr
  );
});


// ====================================================================
// MAIN COMPONENT
// ====================================================================
const CalendarAgendaScreen = () => {
  const [selectedDateStr, setSelectedDateStr] = useState(dayjs().format('YYYY-MM-DD'));
  const [viewMode, setViewMode] = useState('schedule');
  const [isViewModeDropdownOpen, setIsViewModeDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());

  const flatListRef = useRef<FlatList>(null);

  // --- LOGIC MARKED DATES ---
  const markedDates = useMemo(() => {
    let marks: Record<string, any> = {};
    Object.keys(MOCK_EVENTS).forEach(date => {
      marks[date] = { marked: true, dotColor: 'green' };
    });

    const todayStr = dayjs().format('YYYY-MM-DD');

    // Merge logic để tránh ghi đè
    marks[todayStr] = { ...(marks[todayStr] || {}), selected: true, selectedColor: '#1890FF' };

    if (selectedDateStr !== todayStr) {
      marks[selectedDateStr] = { ...(marks[selectedDateStr] || {}), selected: true, selectedColor: '#91D5FF' };
    }
    return marks;
  }, [selectedDateStr]);

  // --- LOGIC DATA LIST ---
  // useMemo này tốt, giữ nguyên
  const daysInMonth = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const daysArray = [];

    let current = startOfMonth;
    while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      let dayOfWeek = current.format('dd'); 
      if (dayOfWeek !== 'CN') dayOfWeek = dayOfWeek.replace('Th', 'T');
      
      daysArray.push({
        date: current,
        dateStr,
        dayNum: current.format('D'),
        dayOfWeek,
        events: MOCK_EVENTS[dateStr] || null
      });
      current = current.add(1, 'day');
    }
    return daysArray;
  }, [currentMonth]);

  // --- HANDLERS ---
  const handleSelectViewMode = (modeKey: string) => {
    setViewMode(modeKey);
    setIsViewModeDropdownOpen(false);
  };

  const toggleCalendar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCalendarOpen(!isCalendarOpen);
  };

  const handleMonthChange = (dateString: string) => {
    const targetDate = dayjs(dateString);
    const today = dayjs();
    let newSelectedDate;

    setCurrentCalendarDate(targetDate.format('YYYY-MM-DD'));
    setCurrentMonth(targetDate);

    if (targetDate.isSame(today, 'month')) {
      newSelectedDate = today.format('YYYY-MM-DD');
    } else {
      newSelectedDate = targetDate.startOf('month').format('YYYY-MM-DD');
    }
    setSelectedDateStr(newSelectedDate);
  };

  // --- 2. TỐI ƯU HÓA: SCROLL ---
  // Xử lý scroll an toàn hơn khi không dùng getItemLayout
  useEffect(() => {
    if (flatListRef.current && daysInMonth.length > 0) {
      const index = daysInMonth.findIndex(d => d.dateStr === selectedDateStr);
      if (index !== -1) {
        flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0 
        });
      }
    }
  }, [selectedDateStr, daysInMonth]);

  const onScrollToIndexFailed = (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 100));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0 });
    });
  };

  // --- 3. TỐI ƯU HÓA: renderItem ---
  // Sử dụng useCallback để không tạo function mới mỗi lần render
  const renderItem = useCallback(({ item }: any) => {
    const isSelected = item.dateStr === selectedDateStr;
    const isToday = item.date.isSame(dayjs(), 'day');

    return (
      <AgendaItem 
        item={item} 
        isSelected={isSelected} 
        isToday={isToday} 
      />
    );
  }, [selectedDateStr]); // Chỉ tạo lại hàm này khi ngày chọn thay đổi

  // ... (Phần renderHeader giữ nguyên) ...
  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.userInfo}>
            <View style={styles.avatarIcon}>
                <Ionicons name="person-circle-outline" size={40} color="#fff" />
            </View>
            <View>
                <Text style={styles.welcomeText}>Xin chào,</Text>
                <Text style={styles.userName}>Nguyễn Văn A</Text>
            </View>
        </View>
        <TouchableOpacity style={{marginTop: 14}}>
            <Ionicons name="menu" size={23} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.filterContainer, { zIndex: 100 }]}>
        <TouchableOpacity style={styles.dropdownBtn} onPress={toggleCalendar}>
          <Text style={styles.dropdownText}>Tháng {dayjs(selectedDateStr).format('M')}</Text>
          <View style={{ marginLeft: 5 }}>
            <Ionicons name={isCalendarOpen ? "chevron-up" : "chevron-down"} size={16} color="#666" />
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}> 
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsViewModeDropdownOpen(!isViewModeDropdownOpen)}>
            <Text style={styles.dropdownText}>{VIEW_MODES.find(m => m.key === viewMode)?.label}</Text>
            <View style={{ marginLeft: 5 }}>
              <Ionicons name={isViewModeDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#666" />
            </View>
          </TouchableOpacity>

          {isViewModeDropdownOpen && (
            <View style={styles.viewModeDropdown}>
              {VIEW_MODES.map((item, index) => {
                const isSelected = viewMode === item.key;
                return (
                  <TouchableOpacity 
                    key={item.key} 
                    style={[styles.viewModeItem, index < VIEW_MODES.length - 1 && styles.viewModeItemBorder]}
                    onPress={() => handleSelectViewMode(item.key)}
                  >
                    <Text style={styles.viewModeText}>{item.label}</Text>
                    {isSelected && <IconSet name="checkmark" size={20} color="#000" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2962FF" barStyle="dark-content" />
      <SafeAreaView style={{ backgroundColor: '#2962FF' }} /> 
      
      {renderHeader()}

      {isCalendarOpen && (
        <View style={styles.calendarContainer}>
          <Calendar
            key={currentCalendarDate}
            current={currentCalendarDate}
            onDayPress={day => setSelectedDateStr(day.dateString)}
            onMonthChange={month => handleMonthChange(month.dateString)}
            markedDates={markedDates}
            theme={{
              todayTextColor: '#1890FF',
              arrowColor: '#1890FF',
              monthTextColor: '#333',
              textMonthFontWeight: 'bold',
            }}
            enableSwipeMonths={true}
          />

          <View style={styles.chipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                 const isActive = dayjs(currentCalendarDate).month() + 1 === month;
                 return (
                   <TouchableOpacity 
                      key={month} 
                      style={[styles.chipBtn, isActive && styles.chipBtnActive]} 
                      onPress={() => {
                        const year = dayjs(currentCalendarDate).year();
                        const dateStr = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD');
                        handleMonthChange(dateStr);
                      }}
                   >
                     <Text style={[styles.chipText, isActive && styles.chipTextActive]}>Thg {month}</Text>
                   </TouchableOpacity>
                 )
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 
        4. TỐI ƯU HÓA: 
        - Đã bỏ getItemLayout vì logic tính toán cũ quá nặng (chứa vòng lặp).
        - Thêm onScrollToIndexFailed để fallback nếu scroll lỗi.
        - Dùng keyExtractor chính xác.
      */}
      <FlatList
        ref={flatListRef}
        data={daysInMonth}
        renderItem={renderItem}
        keyExtractor={(item) => item.dateStr}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={onScrollToIndexFailed} 
        // getItemLayout={getItemLayout} <--- ĐÃ BỎ ĐỂ TRÁNH LAG
        removeClippedSubviews={true} // Giúp performance trên Android
        initialNumToRender={10}      // Chỉ render 10 item đầu tiên
        maxToRenderPerBatch={10}
        windowSize={5}               // Giảm vùng nhớ đệm
      />
    </View>
  );
};

// ... (Giữ nguyên phần styles) ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#2962FF', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop : 45
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarIcon: { marginRight: 10 },
  welcomeText: { color: '#BBDEFB', fontSize: 12 },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  filterContainer: {
    flexDirection: 'row', padding: 16, backgroundColor: '#fff', gap: 12, zIndex: 2,
  },
  dropdownBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff',
  },
  dropdownText: { fontSize: 15, color: '#333' },
  listContent: { paddingBottom: 20, backgroundColor: '#fff' },
  rowWrapper: { backgroundColor: '#fff' },
  itemContainer: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16 },
  leftColumn: { width: 50, alignItems: 'center', marginRight: 12 },
  dateCircle: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4, backgroundColor: 'transparent',
  },
  dateCircleActive: {
    backgroundColor: '#359EFF', shadowColor: "#359EFF", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  dateNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  dateNumberActive: { color: '#fff' },
  dayOfWeekText: { fontSize: 13, color: '#757575', fontWeight: '500' },
  dayOfWeekTextActive: { color: '#359EFF', fontWeight: '700' },
  rightColumn: { flex: 1, paddingTop: 4 },
  emptyText: { fontSize: 14, color: '#BDBDBD', marginTop: 8 },
  eventCard: {
    backgroundColor: '#359EFF', borderRadius: 8, padding: 12, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3,
  },
  eventTextTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  eventTextLocation: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  separatorLine: { height: 1, backgroundColor: '#E0E0E0', marginLeft: 78 },
  todaySeparatorContainer: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, marginTop: 4 },
  todayDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#359EFF', marginRight: 8 },
  todayLine: { flex: 1, height: 2, backgroundColor: '#359EFF' },
  calendarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  chipsContainer: { marginTop: 10, paddingHorizontal: 10 },
  chipBtn: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 16, marginRight: 8, backgroundColor: '#F5F5F5',
  },
  chipBtnActive: { borderColor: '#1890FF', backgroundColor: '#E6F7FF' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#666' },
  chipTextActive: { color: '#1890FF', fontWeight: '700' },
  viewModeDropdown: {
    position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: '#fff',
    borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#eee', zIndex: 999,
  },
  viewModeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  viewModeItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  viewModeText: { fontSize: 16, color: '#333' },
});

export default CalendarAgendaScreen;