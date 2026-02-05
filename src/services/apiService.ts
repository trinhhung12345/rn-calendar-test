// Load environment variables
const BASE_API_URL = 'http://192.168.6.65:3336';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjpudWxsLCJrZXkiOiJhZG1pbiIsImlhdCI6MTc3MDE5Nzg5MywiZXhwIjoxNzcwMjg0MjkzfQ.XRllhOoqgIU3en5jSm5-NBqAkxQs1edojzyoGY3ZFaE';

export interface Beacon {
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

export interface Employee {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  isLocked: boolean;
}

export interface PatrolLog {
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

export interface PatrolSession {
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

export interface ApiResponse {
  data: PatrolSession[];
}

export const fetchPatrolSessions = async (): Promise<PatrolSession[]> => {
  try {
    const response = await fetch(`${BASE_API_URL}/api/patrol-sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching patrol sessions:', error);
    throw error;
  }
};
