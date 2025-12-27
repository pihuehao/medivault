export interface HealthMetrics {
  bloodPressure: number;
  heartRate: number;
  glucoseLevel: number;
}

export interface AccessPermission {
  address: string;
  metrics: number; // bitmask
}

export type MetricType = 'bloodPressure' | 'heartRate' | 'glucoseLevel';

export const METRIC_LABELS: Record<MetricType, string> = {
  bloodPressure: 'Blood Pressure (mmHg)',
  heartRate: 'Heart Rate (BPM)',
  glucoseLevel: 'Glucose (mg/dL)',
};

export const METRIC_ICONS: Record<MetricType, string> = {
  bloodPressure: '🩸',
  heartRate: '💓',
  glucoseLevel: '🍬',
};

export const METRIC_RANGES: Record<MetricType, { min: number; max: number; normal: [number, number] }> = {
  bloodPressure: { min: 70, max: 200, normal: [90, 120] },
  heartRate: { min: 40, max: 200, normal: [60, 100] },
  glucoseLevel: { min: 50, max: 400, normal: [70, 100] },
};
