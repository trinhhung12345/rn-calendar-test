import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExtendedCalendarEvent } from '../../utils/patrolSessionToEvent';
import EventDetailModal from '../calendar/EventDetailModal';

// Type alias for backward compatibility
type CalendarEvent = ExtendedCalendarEvent;

// Component này chỉ render lại khi props (isSelected, isToday, item) thay đổi
const AgendaItem = React.memo(({ item, isSelected, isToday }: any) => {
  const { dayNum, dayOfWeek, events } = item;
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);

  const handleEventPress = (event: CalendarEvent) => {
    if (event.originalSession) {
      setSelectedEvent(event);
      setModalVisible(true);
    }
  };

  return (
    <>
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
            {events ? events.map((event: CalendarEvent, index: number) => (
              <TouchableOpacity key={index} style={styles.eventCard} onPress={() => handleEventPress(event)}>
                <Text style={styles.eventTextTitle}>{event.title}</Text>
                <Text style={styles.eventTextTime}>{event.displayTime || event.time}</Text>
                <Text style={styles.eventTextLocation}>{event.location}</Text>
              </TouchableOpacity>
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
      
      {selectedEvent?.originalSession && (
        <EventDetailModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          eventName={selectedEvent.originalSession.name}
          startTime={selectedEvent.originalSession.planStartTime}
          endTime={selectedEvent.originalSession.planEndTime}
          originalSession={selectedEvent.originalSession}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom Comparison Function (Tùy chọn, để đảm bảo performance tối đa)
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isToday === nextProps.isToday &&
    prevProps.item.dateStr === nextProps.item.dateStr
  );
});

export default AgendaItem;

const styles = StyleSheet.create({
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
  eventTextTime: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  eventTextLocation: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  separatorLine: { height: 1, backgroundColor: '#E0E0E0', marginLeft: 78 },
  todaySeparatorContainer: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, marginTop: 4 },
  todayDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#359EFF', marginRight: 8 },
  todayLine: { flex: 1, height: 2, backgroundColor: '#359EFF' },
});
