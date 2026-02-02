import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Dimensions 
} from 'react-native';
import { UserCircle, Menu, ChevronDown } from 'lucide-react-native';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

// Cấu hình tiếng Việt
dayjs.locale('vi');

// --- TYPE DEFINITIONS ---
interface CalendarEvent {
  id: number;
  time: string;
  location: string;
  color: string;
}

interface AgendaDay {
  date: Dayjs;
  dateStr: string;
  dayNum: string;
  dayOfWeek: string;
  events: CalendarEvent[] | null;
}

// --- DỮ LIỆU MẪU (Mô phỏng API) ---
const MOCK_EVENTS: Record<string, CalendarEvent[]> = {
  '2026-02-02': [
    { id: 1, time: '06:00 - 09:00', location: 'Khu vực: A - Số điểm: 12', color: '#2196F3' }
  ],
  '2026-02-03': [
    { id: 2, time: '06:00 - 09:00', location: 'Khu vực: A - Số điểm: 12', color: '#2196F3' }
  ],
  '2026-02-11': [
    { id: 3, time: '14:00 - 16:00', location: 'Khu vực: A - Số điểm: 12', color: '#2196F3' }
  ]
};

const CalendarAgendaScreen = () => {
  // Chọn tháng hiện tại (ví dụ tháng 2/2026 như trong ảnh)
  // Bạn có thể đổi thành dayjs() để lấy tháng thực tế
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs('2026-02-01'));
  
  // Giả sử ngày mùng 2 đang được chọn (highlight xanh tròn)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-02-02');

  // --- LOGIC TẠO DANH SÁCH NGÀY TRONG THÁNG ---
  const daysInMonth = useMemo<AgendaDay[]>(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const daysArray: AgendaDay[] = [];

    let current = startOfMonth;
    while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      let dayOfWeek = current.format('dd'); 
      if (dayOfWeek !== 'CN') {
        dayOfWeek = dayOfWeek.replace('Th', 'T'); // Đảm bảo định dạng T2, T3
      }
      
      const dayData: AgendaDay = {
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

  // --- RENDER 1 DÒNG (Item Row) ---
  const renderItem = ({ item }: { item: AgendaDay }) => {
    const { dateStr, dayNum, dayOfWeek, events } = item;
    const isSelected = dateStr === selectedDateStr;

    return (
      <View style={styles.itemContainer}>
        {/* CỘT BÊN TRÁI: NGÀY THÁNG */}
        <View style={styles.leftColumn}>
          <View style={[styles.dateCircle, isSelected && styles.dateCircleActive]}>
            <Text style={[styles.dateText, isSelected && styles.dateTextActive]}>
              {dayNum}
            </Text>
          </View>
          <Text style={[styles.dayOfWeekText, isSelected && styles.dayOfWeekTextActive]}>
            {dayOfWeek}
          </Text>
          
          {/* Đường kẻ nối (Timeline decoration - optional) */}
          {/* Nếu muốn giống hệt ảnh chỗ ngày 2 có dấu chấm xanh nhỏ bên cạnh thì thêm view nhỏ ở đây */}
        </View>

        {/* CỘT BÊN PHẢI: NỘI DUNG */}
        <View style={styles.rightColumn}>
          {events ? (
            events.map((event, index) => (
              <View key={`${event.id}-${index}`} style={styles.eventCard}>
                <Text style={styles.eventTime}>Phiên tuần: {event.time}</Text>
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Không có lịch tuần</Text>
          )}
        </View>
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
                <UserCircle size={40} color="#fff" />
            </View>
            <View>
                <Text style={styles.welcomeText}>Xin chào,</Text>
                <Text style={styles.userName}>Nguyễn Văn A</Text>
            </View>
        </View>
        <TouchableOpacity style={{marginTop: 14}}>
            <Menu size={23} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Bar (Dropdowns) */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.dropdownBtn}>
          <Text style={styles.dropdownText}>Tháng {currentMonth.format('M')}</Text>
          <View style={{ marginLeft: 5 }}>
            <ChevronDown size={16} color="#666" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dropdownBtn}>
          <Text style={styles.dropdownText}>Lịch biểu</Text>
          <View style={{ marginLeft: 5 }}>
            <ChevronDown size={16} color="#666" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000000" barStyle="dark-content" />
      
      {renderHeader()}

      <FlatList
        data={daysInMonth}
        renderItem={renderItem}
        keyExtractor={(item) => item.dateStr}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // Background pattern chấm bi mờ (Optional implementation)
        style={{ backgroundColor: '#fff' }} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 45,
  },
  // --- HEADER STYLES ---
  header: {
    backgroundColor: '#2962FF', // Màu xanh đậm như ảnh
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarIcon: {
    marginRight: 10,
    marginTop: 14,
  },
  welcomeText: {
    color: '#BBDEFB', // Xanh nhạt
    fontSize: 12,
    fontWeight: '300',
    marginTop: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // --- FILTER STYLES ---
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12, // Khoảng cách giữa 2 nút
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
  },

  // --- LIST ITEM STYLES ---
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftColumn: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  dateCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateCircleActive: {
    backgroundColor: '#2196F3', // Xanh dương
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  dateTextActive: {
    color: '#fff',
  },
  dayOfWeekText: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  dayOfWeekTextActive: {
    color: '#2196F3', // Chữ thứ đổi màu xanh nếu active
  },
  
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E', // Màu xám nhạt
    fontStyle: 'italic', // Chữ nghiêng nhẹ cho đẹp
    marginTop: 10,
  },
  eventCard: {
    backgroundColor: '#42A5F5', // Màu nền thẻ sự kiện (Xanh nhạt hơn header chút)
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4, // Viền đậm bên trái (nếu thích)
    borderLeftColor: '#1565C0',
  },
  eventTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventLocation: {
    color: '#fff',
    fontSize: 13,
  },
});

export default CalendarAgendaScreen;