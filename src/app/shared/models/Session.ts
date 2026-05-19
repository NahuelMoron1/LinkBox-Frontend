export interface SessionInfo {
  id: string;
  session_name: string;
  start_time: string;
  end_time: string | null;
  total_records: number;
  status: 'recording' | 'draft' | 'completed';
  created_at: string;
}

export interface TelemetryDataPoint {
  id: string;
  rpm: number;
  water_temp: number;
  oil_temp: number;
  oil_press: number;
  fuel_press: number;
  sonda: number;
  gear: number;
  timestamp: string;
}

export interface SessionDataResponse {
  session: {
    id: string;
    name: string;
    startTime: string;
    endTime: string | null;
    totalRecords: number;
  };
  data: TelemetryDataPoint[];
}
