import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
 View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, StatusBar, ScrollView, LayoutAnimation, Platform, UIManager, ActivityIndicator, Alert
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { Calendar } from 'react-native-calendars';

import AgendaItem from '../components/calendar/AgendaItem';
import DayView from '../components/calendar/DayView';
import WeekView from '../components/calendar/WeekView';
import MonthView from '../components/calendar/MonthView';
import CalendarHeader from '../components/calendar/CalendarHeader';
import ViewModeSelector from '../components/calendar/ViewModeSelector';
import EventDetailModal from '../components/calendar/EventDetailModal';

import { VIEW_MODES } from '../utils/calendar/calendarConstants';
import { fetchPatrolSessions } from '@services/apiService';
import { groupPatrolSessionsByDate, ExtendedCalendarEvent } from '@utils/patrolSessionToEvent';

// Type alias for backward compatibility
type CalendarEvent = ExtendedCalendarEvent;

// Kích hoạt layout animation trên Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [eventsData, setEventsData] = useState<Record<string, CalendarEvent[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // Fetch patrol sessions from API
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const sessions = await fetchPatrolSessions();
        console.log('Fetched sessions:', sessions); // Debug log
        
        // Log each session's details including name, start/end times and number of points
        sessions.forEach((session, index) => {
          console.log(`Session ${index + 1}:`);
          console.log(`  Name: ${session.name}`);
          console.log(`  Plan Start Time: ${session.planStartTime}`);
          console.log(`  Plan End Time: ${session.planEndTime}`);
          console.log(`  Number of Points: ${session.numberOfPoints}`);
          console.log(`  Status: ${session.status}`);
          
          if (session.patrolLogs && session.patrolLogs.length > 0) {
            console.log(`  Patrol Logs:`);
            session.patrolLogs.forEach((log, logIdx) => {
              console.log(`    ${logIdx + 1}. Beacon: ${log.beacon.name}, Failed Count: ${log.beacon.failedCount}`);
            });
          } else {
            console.log(`  No patrol logs`);
          }
          console.log('---');
        });
        
        console.log(`Total sessions: ${sessions.length}`);
        
        const groupedEvents = groupPatrolSessionsByDate(sessions);
        console.log('Grouped events:', groupedEvents); // Debug log
        
        // Count total events across all dates
        let totalEvents = 0;
        Object.values(groupedEvents).forEach(events => {
          totalEvents += events.length;
          events.forEach(event => {
            console.log(`Event: ${event.title}, Time: ${event.time}, Display Time: ${event.displayTime || 'N/A'}, Layout Time: ${event.layoutTime || 'N/A'}`);
            console.log(`Original Session: `, event.originalSession);
            
            // Detailed log of patrol logs if available
            if (event.originalSession && event.originalSession.patrolLogs) {
              console.log(`  Patrol Logs for ${event.title}:`);
              event.originalSession.patrolLogs.forEach((log, logIdx) => {
                console.log(`    ${logIdx + 1}. Beacon: ${log.beacon.name}, Failed Count: ${log.beacon.failedCount}`);
              });
            }
          });
        });
        console.log(`Total events created: ${totalEvents}`);
        
        setEventsData(groupedEvents);
      } catch (err) {
        console.error('Error loading patrol sessions:', err);
        setError('Không thể tải dữ liệu kiểm tra');
        Alert.alert('Lỗi', 'Không thể tải dữ liệu kiểm tra. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // --- LOGIC MARKED DATES ---
  const markedDates = useMemo(() => {
    let marks: Record<string, any> = {};
    Object.keys(eventsData).forEach(date => {
      marks[date] = { marked: true, dotColor: 'green' };
    });

    const todayStr = dayjs().format('YYYY-MM-DD');

    // Merge logic để tránh ghi đè
    marks[todayStr] = { ...(marks[todayStr] || {}), selected: true, selectedColor: '#1890FF' };

    if (selectedDateStr !== todayStr) {
      marks[selectedDateStr] = { ...(marks[selectedDateStr] || {}), selected: true, selectedColor: '#91D5FF' };
    }
    return marks;
  }, [selectedDateStr, eventsData]);

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
        events: eventsData[dateStr] || null
      });
      current = current.add(1, 'day');
    }
    return daysArray;
  }, [currentMonth, eventsData]);

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

  const renderHeader = () => (
    <View>
      <CalendarHeader userName="Nguyễn Văn A" />
      
      <View style={[styles.filterContainer, { zIndex: 100 }]}>
        <TouchableOpacity style={styles.dropdownBtn} onPress={toggleCalendar}>
          <Text style={styles.dropdownText}>Tháng {dayjs(selectedDateStr).format('M')}</Text>
          <View style={{ marginLeft: 5 }}>
            <Ionicons name={isCalendarOpen ? "chevron-up" : "chevron-down"} size={16} color="#666" />
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}> 
          <ViewModeSelector 
            currentViewMode={viewMode} 
            onModeChange={setViewMode} 
          />
        </View>
      </View>
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#2962FF" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2962FF" />
          <Text style={styles.loadingText}>Đang tải dữ liệu kiểm tra...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              monthTextColor: '#3',
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
          events={eventsData[selectedDateStr] || []} 
        />
      ) : viewMode === 'week' ? (
        // LỊCH TUẦN (MỚI THÊM)
        <WeekView 
          selectedDateStr={selectedDateStr} 
          eventsData={eventsData} 
          onWeekChange={(newDateStr) => setSelectedDateStr(newDateStr)}
        />
      ) : viewMode === 'month' ? (
        // LỊCH THÁNG (MỚI THÊM)
        <MonthView 
          currentMonth={currentCalendarDate} // Dùng ngày đang xem trên mini calendar
          selectedDateStr={selectedDateStr}
          eventsData={eventsData}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default CalendarAgendaScreen;
