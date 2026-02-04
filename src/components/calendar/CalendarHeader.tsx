import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarHeaderProps {
  userName?: string;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ userName = 'Người dùng' }) => {
  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
          <View style={styles.avatarIcon}>
              <Ionicons name="person-circle-outline" size={40} color="#fff" />
          </View>
          <View>
              <Text style={styles.welcomeText}>Xin chào,</Text>
              <Text style={styles.userName}>{userName}</Text>
          </View>
      </View>
      <TouchableOpacity style={{marginTop: 14}}>
          <Ionicons name="menu" size={23} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default CalendarHeader;

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2962FF', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop : 45
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarIcon: { marginRight: 10 },
  welcomeText: { color: '#BBDEFB', fontSize: 12 },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});