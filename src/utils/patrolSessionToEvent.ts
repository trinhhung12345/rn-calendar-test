import dayjs from 'dayjs';
import { PatrolSession } from '../services/apiService';
import { CalendarEvent } from './calendar/calendarConstants';

// Extend the CalendarEvent interface to include original session data
export interface ExtendedCalendarEvent extends CalendarEvent {
  originalSession?: PatrolSession;
  displayTime?: string; // Time for display purposes
  layoutTime?: string; // Time for layout calculations
}

// Function to convert patrol sessions to calendar events format used in the agenda
export const patrolSessionToCalendarEvent = (session: PatrolSession): ExtendedCalendarEvent[] => {
  // Convert the patrol session data to the format expected by the calendar components
  // Handle multi-day events by creating separate events for each day
  
  // Use planStartTime if startDate is null
  const startDate = session.startDate ? dayjs(session.startDate) : dayjs(session.planStartTime);
  const endDate = dayjs(session.planEndTime);
  
  // Calculate the number of days the session spans
  const daysSpanned = endDate.diff(startDate, 'day');
  
  const events: ExtendedCalendarEvent[] = [];
  
  // Format the time range from planStartTime to planEndTime for layout calculations
  // For layout calculations, we need just the time portion (HH:mm - HH:mm)
  const startTime = dayjs(session.planStartTime).format('HH:mm');
  const endTime = dayjs(session.planEndTime).format('HH:mm');
  const layoutTimeRange = `${startTime} - ${endTime}`; // Format for layout calculations
  
  // Format the date range for display (includes date and time)
  const startDateFormatted = dayjs(session.planStartTime).format('DD/MM HH:mm');
  const endDateFormatted = dayjs(session.planEndTime).format('DD/MM HH:mm');
  const displayTimeRange = `${startDateFormatted} - ${endDateFormatted}`; // Format for display
  
  // Create an event for each day the session spans
  for (let i = 0; i <= Math.max(0, daysSpanned); i++) {
    const currentDate = startDate.add(i, 'day');
    const dateKey = currentDate.format('YYYY-MM-DD');
    
    // For the first day, use the original start time; for subsequent days, use 00:00
    // For the last day, use the original end time; for other days, use 23:59
    let eventStartTime = startTime;
    let eventEndTime = endTime;
    if (i > 0) { // Not the first day
      eventStartTime = '00:00';
    }
    
    if (i < daysSpanned) { // Not the last day
      eventEndTime = '23:59';
    }
    
    // Format the time range for this specific day
    const dailyTimeRange = `${eventStartTime} - ${eventEndTime}`;
    
    // Format the location/notes with the name and number of points (following your requirement)
    // Don't include area since you mentioned to exclude it
    const location = `Số điểm: ${session.numberOfPoints}`;
    
    events.push({
      id: `${session.id}_${dateKey}`, // Unique ID for each day of the session
      time: layoutTimeRange, // Use time format suitable for layout calculations
      displayTime: displayTimeRange, // Store the display format separately
      layoutTime: layoutTimeRange, // Store the layout format separately
      location: location,
      title: session.name,
      originalSession: session, // Store the original session data for later use
    });
  }
  
  return events;
};

// Function to group patrol sessions by date for the calendar agenda
export const groupPatrolSessionsByDate = (sessions: PatrolSession[]): Record<string, ExtendedCalendarEvent[]> => {
  const grouped: Record<string, ExtendedCalendarEvent[]> = {};
  
  // Log the sessions for debugging
  console.log('Total patrol sessions fetched:', sessions.length);
  
  sessions.forEach(session => {
    // Log session details
    console.log(`Session: ${session.name}, Start: ${session.startDate}, Plan Start: ${session.planStartTime}, Plan End: ${session.planEndTime}, Points: ${session.numberOfPoints}`);
    console.log(`Patrol Logs: `, session.patrolLogs);
    
    // Convert the session to one or more calendar event formats (depending on days spanned)
    const calendarEvents = patrolSessionToCalendarEvent(session);
    
    calendarEvents.forEach(event => {
      // Extract date from the event's ID to determine date
      const dateKey = event.id.split('_')[1]; // Extract date from the ID
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(event);
    });
  });
  
  // Count total events
  let totalEvents = 0;
  Object.values(grouped).forEach(events => {
    totalEvents += events.length;
  });
  
  console.log('Total calendar events created:', totalEvents);
  
  return grouped;
};
