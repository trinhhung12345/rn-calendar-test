import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
 View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, StatusBar, ScrollView, LayoutAnimation, Platform, UIManager 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { Calendar, LocaleConfig } from 'react-native-calendars';


// Cấu hình tiếng Việt cho react-native-calendars
LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6','Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'],
  dayNames: ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'], // Giống thiết kế
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

// Cấu hình tiếng Việt cho dayjs
dayjs.locale('vi');

// Kích hoạt LayoutAnimation cho Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


// --- DỮ LIỆU MẪU (Cập nhật ngày 3/2 để test) ---
const MOCK_EVENTS: Record<string, any[]> = {
  '2026-02-02': [{ id: 1, time: '06:00 - 09:00', location: 'Khu vực: A - Số điểm: 12' }],
  // Thêm dữ liệu cho ngày 3/2 (Hôm nay)
  '2026-02-03': [
    { id: 2, time: '06:00 - 09:00', location: 'Khu vực: B - Số điểm: 10' },
    { id: 3, time: '14:00 - 16:00', location: 'Khu vực: C - Số điểm: 8' }
  ],
  '2026-02-11': [{ id: 4, time: '14:00 - 16:00', location: 'Khu vực: A - Số điểm: 12' }],
  '2026-02-14': [{ id: 5 }],
};

const CalendarAgendaScreen = () => {
  // 1. SỬA LỖI LOGIC NGÀY: 
 // Khởi tạo bằng ngày hiện tại thực tế thay vì hardcode
  // Nếu muốn test ngày 3/2/2026 thì dùng: useState('2026-02-03')
  const [selectedDateStr, setSelectedDateStr] = useState(dayjs().format('YYYY-MM-DD'));
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(true); // Mặc định mở lịch để dễ nhìn
  const [currentCalendarDate, setCurrentCalendarDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  // State quản lý tháng hiện tại trên Calendar
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());

  // Ref để điều khiển cuộn
  const flatListRef = useRef<FlatList>(null);

  // --- LOGIC MARKED DATES ---
  const markedDates = useMemo(() => {
    let marks: Record<string, any> = {};
    
    // Đánh dấu chấm sự kiện (Màu xanh lá) cho tất cả các ngày có sự kiện
    Object.keys(MOCK_EVENTS).forEach(date => {
      marks[date] = { 
        ...marks[date],
        marked: true, 
        dotColor: 'green' 
      };
    });

    const todayStr = dayjs().format('YYYY-MM-DD');

    // Logic: 
    // 1. Mark ngày HÔM NAY: Màu #1890FF (Đậm)
    marks[todayStr] = {
      ...marks[todayStr], // Giữ lại các thuộc tính khác nếu có (ví dụ dotColor)
      selected: true,
      selectedColor: '#1890FF'
    };

    // 2. Mark ngày ĐANG CHỌN (Nếu khác ngày hôm nay): Màu nhạt hơn
    if (selectedDateStr !== todayStr) {
      marks[selectedDateStr] = {
        ...marks[selectedDateStr], // Giữ lại các thuộc tính khác nếu có
        selected: true,
        selectedColor: '#91D5FF' // Màu xanh nhạt hơn
      };
    }
    
    // Lưu ý: Nếu Selected == Today thì logic (1) sẽ đè lên -> Vẫn hiện màu đậm (Đúng yêu cầu)
    
    return marks;
  }, [selectedDateStr]);

  // --- LOGIC TẠO DANH SÁCH NGÀY TRONG THÁNG ---
  const daysInMonth = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const daysArray: Array<{
      date: dayjs.Dayjs;
      dateStr: string;
      dayNum: string;
      dayOfWeek: string;
      events: any;
    }> = [];

    let current = startOfMonth;
    while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      let dayOfWeek = current.format('dd'); 
      if (dayOfWeek !== 'CN') {
        dayOfWeek = dayOfWeek.replace('Th', 'T'); // Đảm bảo định dạng T2, T3
      }
      
      const dayData = {
        date: current,
        dateStr,
        dayNum: current.format('D'),
        dayOfWeek,
        events: MOCK_EVENTS[dateStr] || null
      };
      
      daysArray.push(dayData);
      current = current.add(1, 'day');
    }
    return daysArray;
  }, [currentMonth]);

  // --- HANDLER: BẤM NÚT DROPDOWN ---
  const toggleCalendar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCalendarOpen(!isCalendarOpen);
  };

  // --- HANDLER: CHỌN THÁNG TỪ CHIPS ---
  const handleSelectMonthChip = (monthIndex: number) => {
    // monthIndex: 1 -> Tháng 1, 2 -> Tháng 2
    // Tạo ngày mới: Năm 2026, Tháng = monthIndex, Ngày 01
    const year = dayjs(currentCalendarDate).year();
    const newDate = dayjs(`${year}-${monthIndex}-01`).format('YYYY-MM-DD');
    
    handleMonthChange(newDate); // Sử dụng hàm xử lý chung
  };

  // --- 2. HÀM XỬ LÝ CHUYỂN THÁNG (Dùng chung cho cả Swipe Lịch và bấm Chip) ---
  const handleMonthChange = (dateString: string) => { // dateString dạng 'YYYY-MM-DD'
    const targetDate = dayjs(dateString);
    const today = dayjs();
    let newSelectedDate;

    // Cập nhật tháng hiển thị trên Calendar Dropdown
    setCurrentCalendarDate(targetDate.format('YYYY-MM-DD'));
    setCurrentMonth(targetDate); // Cập nhật tháng cho danh sách ngày

    // LOGIC CHECK NGÀY:
    // Nếu tháng được chọn TRÙNG với tháng hiện tại thực tế -> Chọn ngày HÔM NAY
    if (targetDate.isSame(today, 'month')) {
      newSelectedDate = today.format('YYYY-MM-DD');
    } else {
      // Nếu là tháng khác -> Chọn ngày MÙNG 1
      newSelectedDate = targetDate.startOf('month').format('YYYY-MM-DD');
    }

    setSelectedDateStr(newSelectedDate);
  };

  // --- 3. HÀM XỬ LÝ SCROLL (Tự động cuộn khi selectedDateStr thay đổi) ---
  useEffect(() => {
    if (flatListRef.current && daysInMonth.length > 0) {
      // Tìm vị trí (index) của ngày đang chọn trong danh sách tháng
      const index = daysInMonth.findIndex(d => d.dateStr === selectedDateStr);
      
      if (index !== -1) {
        // Scroll đến vị trí đó
        flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0 // 0: Đầu danh sách, 0.5: Giữa
        });
      }
    }
  }, [selectedDateStr, daysInMonth]);

  // Cần thêm hàm getItemLayout cho FlatList để scrollToIndex hoạt động mượt mà ko lỗi
  const getItemLayout = (data: any, index: number) => (
    // Giả sử mỗi item cao khoảng 120px (ước lượng từ style padding + content)
    { length: 120, offset: 120 * index, index }
  );

  // --- RENDER ITEM ---
  const renderItem = ({ item }: any) => {
    const dateStr = item.date.format('YYYY-MM-DD');
    const dayNum = item.date.format('D');
    let dayOfWeek = item.date.format('dd'); 
    if (dayOfWeek !== 'CN') dayOfWeek = dayOfWeek.replace('Th', 'T');

    const events = MOCK_EVENTS[dateStr];
    
    // --- SỬA LOGIC HIỂN THỊ TẠI ĐÂY ---
    const isSelected = dateStr === selectedDateStr; // Chỉ true khi user click vào ngày này
    const isToday = item.date.isSame(dayjs(), 'day'); // True nếu là hôm nay

    return (
      <View style={styles.rowWrapper}>
        <View style={styles.itemContainer}>
          {/* CỘT TRÁI: NGÀY */}
          <View style={styles.leftColumn}>
            {/* 2. SỬA LỖI VÒNG TRÒN: Chỉ hiện khi isSelected = true */}
            <View style={[styles.dateCircle, isSelected && styles.dateCircleActive]}>
              <Text style={[styles.dateNumber, isSelected && styles.dateNumberActive]}>
                {dayNum}
              </Text>
            </View>
            
            {/* Text thứ: Nếu Selected thì xanh đậm, không thì xám */}
            <Text style={[styles.dayOfWeekText, isSelected && styles.dayOfWeekTextActive]}>
              {dayOfWeek}
            </Text>
          </View>

          {/* CỘT PHẢI: LIST EVENT */}
          <View style={styles.rightColumn}>
            {events ? events.map((event: any, index: number) => (
                <View key={index} style={styles.eventCard}>
                  <Text style={styles.eventTextTitle}>Phiên tuần: {event.time}</Text>
                  <Text style={styles.eventTextLocation}>{event.location}</Text>
                </View>
              )) : <Text style={styles.emptyText}>Không có lịch tuần</Text>}
          </View>
        </View>

        {/* --- GẠCH CHÂN --- */}
        {/* Nếu là Hôm Nay: Hiện gạch đậm + chấm tròn (Bất kể có đang select hay không) */}
        {isToday ? (
          <View style={styles.todaySeparatorContainer}>
             <View style={styles.todayDot} />
             <View style={styles.todayLine} />
          </View>
        ) : (
          // Ngày thường: Gạch mờ
          <View style={styles.separatorLine} />
        )}
      </View>
    );
  };

  // --- HEADER & FILTER ---
  const renderHeader = () => (
    <View>
      {/* Blue Header */}
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

      {/* Filter Bar (Dropdowns) */}
      <View style={styles.filterContainer}>
        {/* Nút THÁNG 2: Bấm vào để xổ Calendar xuống */}
        <TouchableOpacity style={styles.dropdownBtn} onPress={toggleCalendar}>
          <Text style={styles.dropdownText}>
            Tháng {dayjs(selectedDateStr).format('M')}
          </Text>
          <View style={{ marginLeft: 5 }}>
            <Ionicons name={isCalendarOpen ? "chevron-up" : "chevron-down"} size={16} color="#666" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dropdownBtn}>
          <Text style={styles.dropdownText}>Lịch biểu</Text>
          <View style={{ marginLeft: 5 }}>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2962FF" barStyle="dark-content" />
      <SafeAreaView style={{ backgroundColor: '#2962FF' }} /> 
      
      {renderHeader()}

      {/* --- KHỐI LỊCH MỞ RỘNG (EXPANDABLE) --- */}
      {isCalendarOpen && (
        <View style={styles.calendarContainer}>
          {/* 1. Lịch tháng */}
          <Calendar
            key={currentCalendarDate} // Thêm key để force update khi thay đổi tháng
            current={currentCalendarDate}
            
            // Khi bấm chọn ngày cụ thể trên Dropdown
            onDayPress={day => {
              setSelectedDateStr(day.dateString);
            }}

            // Khi vuốt trái/phải trên Calendar -> Gọi hàm xử lý chung
            onMonthChange={month => {
              handleMonthChange(month.dateString);
            }}

            markedDates={markedDates}
            // markingType={'simple'} // Quay về simple để hỗ trợ dot mark
            
            theme={{
              todayTextColor: '#1890FF',
              arrowColor: '#1890FF',
              monthTextColor: '#33',
              textMonthFontWeight: 'bold',
              // ... giữ các theme cũ
            }}
            enableSwipeMonths={true}
          />

          {/* 2. List Chips chọn tháng (Thg 1, Thg 2...) */}
          <View style={styles.chipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                 // Kiểm tra xem chip này có trùng với tháng đang hiển thị ko
                 const isActive = dayjs(currentCalendarDate).month() + 1 === month;
                 
                 return (
                   <TouchableOpacity 
                      key={month} 
                      // Style đổi màu nếu Active
                      style={[styles.chipBtn, isActive && styles.chipBtnActive]} 
                      onPress={() => {
                        // Tạo ngày giả định: Năm hiện tại - Tháng chọn - Ngày 01
                        const year = dayjs(currentCalendarDate).year();
                        const dateStr = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD');
                        handleMonthChange(dateStr);
                      }}
                   >
                     <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                       Thg {month}
                     </Text>
                   </TouchableOpacity>
                 )
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* --- DANH SÁCH LỊCH BIỂU (AGENDA) --- */}
      <FlatList
        ref={flatListRef} // Gắn ref
        data={daysInMonth}
        renderItem={renderItem}
        keyExtractor={(item) => item.dateStr}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout} // Gắn layout fix lỗi scroll
        
        // Loại bỏ initialScrollIndex nếu dùng useEffect scroll ở trên để tránh xung đột
      />
    </View>
  );
};

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

  // --- LIST ITEM STYLES ---
  listContent: {
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  rowWrapper: {
    backgroundColor: '#fff',
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 12, // Tăng khoảng cách trên dưới chút cho thoáng
    paddingHorizontal: 16,
  },
  
  // --- STYLE CHO CỘT NGÀY (LEFT) ---
  leftColumn: { width: 50, alignItems: 'center', marginRight: 12 },
  dateCircle: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4, backgroundColor: 'transparent',
  },
  // Style Active chỉ dành cho SELECTED DATE
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
  
  // SEPARATOR
  separatorLine: { height: 1, backgroundColor: '#E0E0E0', marginLeft: 78 },
  
  // TODAY INDICATOR (Luôn hiện ở ngày hôm nay)
  todaySeparatorContainer: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, marginTop: 4 },
  todayDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#359EFF', marginRight: 8 },
  todayLine: { flex: 1, height: 2, backgroundColor: '#359EFF' },
  
  // --- HIỆU ỨNG NỀN CHO NGÀY HÔM NAY (OPTIONAL) ---
  // Nếu muốn ngày hôm nay có nền hơi sáng lên chút xíu cho dễ nhận biết
  todayBackground: {
    backgroundColor: '#F7F9FC', // Màu xám xanh cực nhạt
  },
  
  // --- STYLE CHO CALENDAR EXPAND ---
  calendarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  chipsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  chipBtn: {
    borderWidth: 1,
    borderColor: '#E0E0E0', // Viền nhạt mặc định
    borderRadius: 20, // Bo tròn nhiều hơn cho giống chip
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#F5F5F5', // Nền xám nhạt mặc định
  },
  chipBtnActive: {
    borderColor: '#1890FF',
    backgroundColor: '#E6F7FF', // Nền xanh rất nhạt
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  chipTextActive: {
    color: '#1890FF', // Chữ xanh khi active
    fontWeight: '700',
  },
});

export default CalendarAgendaScreen;