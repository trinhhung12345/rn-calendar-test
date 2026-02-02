// src/utils/dummyData.ts
import dayjs from 'dayjs';
import { ICalendarEventBase } from 'react-native-big-calendar';

export interface CalendarEvent extends ICalendarEventBase {
  color?: string;
}

export const generateDummyEvents = (): CalendarEvent[] => {
  const today = dayjs();
  
  return [
    {
      title: 'Họp team React Native',
      start: today.set('hour', 9).set('minute', 0).toDate(),
      end: today.set('hour', 10).set('minute', 30).toDate(),
      color: '#4285F4', // Google Blue
    },
    {
      title: 'Ăn trưa',
      start: today.set('hour', 12).set('minute', 0).toDate(),
      end: today.set('hour', 13).set('minute', 0).toDate(),
      color: '#F4B400', // Google Yellow
    },
    {
      title: 'Review Code',
      start: today.set('hour', 14).set('minute', 0).toDate(),
      end: today.set('hour', 15).set('minute', 0).toDate(),
      color: '#0F9D58', // Google Green
    },
    {
      title: 'Sự kiện ngày mai',
      start: today.add(1, 'day').set('hour', 10).set('minute', 0).toDate(),
      end: today.add(1, 'day').set('hour', 11).set('minute', 0).toDate(),
      color: '#DB4437', // Google Red
    },
  ];
};