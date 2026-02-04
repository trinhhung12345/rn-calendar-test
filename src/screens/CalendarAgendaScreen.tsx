import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
 View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, StatusBar, ScrollView, LayoutAnimation, Platform, UIManager, NativeSyntheticEvent, NativeScrollEvent, Dimensions
} from 'react-native';

const windowWidth = Dimensions.get('window').width;
import { Ionicons } from '@expo/vector-icons';
// Giả sử bạn dùng icon check, nếu không có lucide thì dùng Ionicons thay thế
import { Ionicons as IconSet } from '@expo/vector-icons'; 
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { Calendar } from 'react-native-calendars';

import { MOCK_EVENTS, VIEW_MODES } from '../utils/calendar/calendarConstants';
import { parseTimeToMinutes, getEventLayout, HOUR_HEIGHT, START_HOUR, END_HOUR } from '../utils/calendar/timeUtils';
import LocaleConfig from '../utils/calendar/localeConfig';

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
// COMPONENT DAY VIEW (Figma Style - iOS)
// ====================================================================
const DayView = ({ dateStr, events }: { dateStr: string, events: any[] }) => {
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
            
            {/* Hiển thị text giờ hiện tại (tùy chọn giống iOS) */}
            {/* <View style={styles.currentTimeBadge}>
              <Text style={styles.currentTimeText}>
                {currentTime.format('HH:mm')}
              </Text>
            </View> */}
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

// ====================================================================
// COMPONENT WEEK VIEW (Single Week Display - No Swipe)
// ====================================================================
const WeekView = ({ selectedDateStr, eventsData, onWeekChange }: { selectedDateStr: string, eventsData: Record<string, any[]>, onWeekChange: (newDateStr: string) => void }) => {
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


// ====================================================================
// COMPONENT MONTH VIEW (Giao diện giống ảnh)
// ====================================================================
const MonthView = ({ 
  currentMonth, 
  selectedDateStr, 
  eventsData, 
  onDayPress,
  onMonthChange
}: { 
 currentMonth: string, 
  selectedDateStr: string, 
  eventsData: Record<string, any[]>, 
  onDayPress: (dateStr: string) => void,
  onMonthChange: (dateStr: string) => void
}) => {
  // 1. Cấu hình tên thứ (T2 - CN)
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

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

  return (
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
                  {item.events.slice(0, 2).map((evt: any, evtIdx: number) => (
                    <View key={evtIdx} style={styles.monthEventBox}>
                      <Text style={styles.monthEventText} numberOfLines={1}>
                        {evt.time.split(' - ')[0]} Phiên tuần
                      </Text>
                    </View>
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
  );
};

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
              monthTextColor: '#33',
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

      {/* --- NỘI DUNG CHÍNH --- */}
      {viewMode === 'schedule' ? (
        // LỊCH BIỂU (Code cũ)
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
      ) : viewMode === 'day' ? (
        // LỊCH NGÀY (Mới thêm)
        <DayView 
          dateStr={selectedDateStr} 
          events={MOCK_EVENTS[selectedDateStr] || []} 
        />
      ) : viewMode === 'week' ? (
        // LỊCH TUẦN (MỚI THÊM)
        <WeekView 
          selectedDateStr={selectedDateStr} 
          eventsData={MOCK_EVENTS} 
          onWeekChange={(newDateStr) => setSelectedDateStr(newDateStr)}
        />
      ) : viewMode === 'month' ? (
        // LỊCH THÁNG (MỚI THÊM)
        <MonthView 
          currentMonth={currentCalendarDate} // Dùng ngày đang xem trên mini calendar
          selectedDateStr={selectedDateStr}
          eventsData={MOCK_EVENTS}
          onDayPress={(dateStr) => {
            setSelectedDateStr(dateStr);
            // Khi chọn ngày ở chế độ tháng, thường ta không cần chuyển ngày calendar
            // trừ khi muốn nhảy tháng. Để đơn giản ta chỉ select date.
          }}
          onMonthChange={handleMonthChange}
        />
      ) : (
        // Placeholder cho các chế độ khác (nếu có thêm sau này)
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
           <Text>Chế độ xem {VIEW_MODES.find(v => v.key === viewMode)?.label} đang phát triển</Text>
        </View>
      )}
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
  
  // ====================================================================
  // STYLES MỚI CHO DAY VIEW (THEO YÊU CẦU: GIAO DIỆN IPHONE)
  // ====================================================================
  
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
    // Không cần borderRight ở đây, dùng đường kẻ dọc trong timeline column để đồng bộ
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
    height: 2, // Dày hơn chút cho rõ
    backgroundColor: '#359EFF',
    marginLeft: 2, // Khoảng cách nhỏ từ chấm tròn
  },

  // Ô chứa text giờ hiện tại
  currentTimeBadge: {
    position: 'absolute',
    left: 16,
    top: 6,
    backgroundColor: '#359EFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  currentTimeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
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
  
  // ====================================================================
  // STYLES CHO WEEK VIEW (RESPONSIVE LAYOUT - KHÔNG LAG)
  // ====================================================================
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
  
  // ====================================================================
  // STYLES CHO MONTH VIEW (Giống ảnh)
  // ====================================================================
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
});

export default CalendarAgendaScreen;