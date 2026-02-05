import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

interface Beacon {
  id: number;
  name: string;
  macAddress: string;
  location: string;
  cameraIds: number[];
  createdAt: string;
  updatedAt: string;
  availableStatus: boolean;
  failedCount: number;
  uuid: string;
  major: string;
  minor: string;
}

interface Employee {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  isLocked: boolean;
}

interface PatrolLog {
  id: number;
  patrolSessionId: number;
  beaconId: number;
  isChecked: boolean;
  checkinTime: string | null;
  rssi: number | null;
  distanceEstimated: number | null;
  createdAt: string;
  updatedAt: string;
  index: number;
  beacon: Beacon;
}

interface PatrolSession {
  id: number;
  comments: string;
  status: string;
  name: string;
  startDate: string;
  planStartTime: string;
  planEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  createdAt: string;
  updatedAt: string;
  numberOfPoints: number;
  numberOfCheckedPoints: number;
  automaticScheduling: boolean;
  other: {
    key: number;
    automaticSchedulingType: string;
  };
  employees: Employee[];
  patrolLogs: PatrolLog[];
}

interface EventDetailModalProps {
  visible: boolean;
  onClose: () => void;
  eventName: string;
  startTime: string;
 endTime: string;
  originalSession?: PatrolSession;
}

const { width } = Dimensions.get('window');

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  visible,
 onClose,
  eventName,
  startTime,
  endTime,
  originalSession,
}) => {
  // Format the date range for display
  const formatDateRange = (start: string, end: string) => {
    const startDate = dayjs(start).format('DD/MM/YYYY HH:mm');
    const endDate = dayjs(end).format('DD/MM/YYYY HH:mm');
    return `${startDate} - ${endDate}`;
  };

  // Format a single date
  const formatDate = (date: string) => {
    return dayjs(date).format('DD/MM/YYYY HH:mm');
  };

  // Debug logging
  console.log("EventDetailModal - originalSession:", originalSession);
  console.log("EventDetailModal - originalSession type:", typeof originalSession);
  if (originalSession) {
    console.log("EventDetailModal - originalSession keys:", Object.keys(originalSession));
    console.log("EventDetailModal - originalSession.patrolLogs:", originalSession.patrolLogs);
    console.log("EventDetailModal - originalSession.employees:", originalSession.employees);
    console.log("EventDetailModal - originalSession.status:", originalSession.status);
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Header with close button */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chi tiết phiên tuần tra</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Event name */}
            <View style={styles.section}>
              <Text style={styles.eventName}>{eventName || 'Không có tên sự kiện'}</Text>
            </View>

            {/* Date range */}
            <View style={styles.section}>
              <Text style={styles.dateRange}>{formatDateRange(startTime, endTime)}</Text>
            </View>

            {/* Session Status */}
            {originalSession && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trạng thái phiên:</Text>
                <Text style={styles.infoText}>• Trạng thái: {originalSession.status}</Text>
                <Text style={styles.infoText}>• Số điểm đã kiểm tra: {originalSession.numberOfCheckedPoints}/{originalSession.numberOfPoints}</Text>
              </View>
            )}

            {/* Employee Information */}
            {originalSession && originalSession.employees && originalSession.employees.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nhân viên phụ trách:</Text>
                {originalSession.employees.map((employee, index) => (
                  <View key={employee.id || index} style={styles.employeeItem}>
                    <Text style={styles.employeeText}>• {employee.name} ({employee.username})</Text>
                    {employee.email && <Text style={styles.employeeText}>  Email: {employee.email}</Text>}
                    {employee.phone && <Text style={styles.employeeText}>  Điện thoại: {employee.phone}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Comments */}
            {originalSession && originalSession.comments && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ghi chú:</Text>
                <Text style={styles.infoText}>{originalSession.comments}</Text>
              </View>
            )}

            {/* Patrol points list */}
            {originalSession && originalSession.patrolLogs && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Danh sách điểm tuần tra:</Text>
                {originalSession.patrolLogs && originalSession.patrolLogs.length > 0 ? (
                  originalSession.patrolLogs.map((log, index) => (
                    <View key={log.id || index} style={styles.patrolPointItem}>
                      <Text style={styles.patrolPointText}>
                        . {log.beacon.name} (ID: {log.beaconId})
                      </Text>
                      <Text style={styles.patrolPointText}>
                        {'  '}Trạng thái: {log.isChecked ? 'Đã kiểm tra' : 'Chưa kiểm tra'}
                      </Text>
                      {log.checkinTime && (
                        <Text style={styles.patrolPointText}>
                          {'  '}Thời gian kiểm tra: {formatDate(log.checkinTime)}
                        </Text>
                      )}
                      <Text style={styles.patrolPointText}>
                        {'  '}Số lần thất bại: {log.beacon.failedCount}
                      </Text>
                      {log.distanceEstimated && (
                        <Text style={styles.patrolPointText}>
                          {'  '}Khoảng cách ước tính: {log.distanceEstimated}m
                        </Text>
                      )}
                      {log.rssi && (
                        <Text style={styles.patrolPointText}>
                          {'  '}RSSI: {log.rssi}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>Không có điểm tuần tra</Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0.5)',
    padding: 20,
  },
  modalView: {
    width: width * 0.9,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
 },
  content: {
    flexGrow: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  dateRange: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 5,
  },
  employeeItem: {
    marginBottom: 8,
    paddingLeft: 10,
  },
  employeeText: {
    fontSize: 15,
    color: '#555',
  },
  patrolPointItem: {
    marginBottom: 8,
    paddingLeft: 10,
  },
  patrolPointText: {
    fontSize: 15,
    color: '#555',
  },
  noDataText: {
    fontSize: 15,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default EventDetailModal;