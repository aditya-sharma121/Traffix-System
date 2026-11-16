const API_BASE = '/api';

export interface DetectionResult {
  video_filename: string;
  total_frames_in_file: number;
  processed_frames: number;
  processing_time_sec: number;
  processing_fps: number;
  model_engine: string;
  total_unique_vehicles_tracked: number;
  class_distribution: Record<string, number>;
  direction_distribution: Record<string, number>;
  latest_density_analysis: {
    total_vehicles: number;
    total_pcu: number;
    overall_density_percent: number;
    overall_congestion: string;
    directions: Record<string, {
      vehicle_count: number;
      pcu: number;
      density_percent: number;
      congestion_level: string;
      estimated_queue_length_m: number;
      estimated_queue_count: number;
      estimated_wait_time_sec: number;
      has_emergency: boolean;
      class_breakdown: Record<string, number>;
    }>;
  };
  optimized_signal_schedule: {
    phase: string;
    active_directions?: string[];
    active_direction?: string;
    green_duration: number;
    yellow_duration: number;
    all_red_duration: number;
    is_emergency_preemption: boolean;
    signals: Record<string, string>;
    explanation: {
      primary_reason: string;
      fairness_rating?: string;
      metrics_used?: any;
    };
  };
  sample_frames_history?: Array<{
    frame: number;
    count: number;
    density: number;
    vehicles: Array<{
      id: number;
      bbox: number[];
      class_name: string;
      confidence: number;
      direction: string;
      is_emergency: boolean;
    }>;
  }>;
}

export interface SimulationState {
  junction_id: string;
  phase: string;
  mode: string;
  signals: Record<string, 'GREEN' | 'YELLOW' | 'RED'>;
  time_remaining: number;
  allocated_green: number;
  emergency_active: boolean;
  emergency_direction: string | null;
  intersection_cleared?: boolean;
  vehicles: Array<{
    id: number;
    direction: string;
    type: string;
    turn?: string;
    position: number;
    length?: number;
    width?: number;
    speed: number;
    is_emergency: boolean;
    color: string;
    waiting_time: number;
  }>;
  vehicle_count: number;
  queues: Record<string, number>;
  total_spawned: number;
  total_cleared: number;
  avg_wait_time: number;
  throughput_vpm: number;
  last_decision?: any;
}

export interface BenchmarkResult {
  scenario: string;
  duration_seconds: number;
  total_vehicles_tested: number;
  fixed_time_results: {
    avg_waiting_time_sec: number;
    avg_queue_length: number;
    total_delay_sec: number;
    vehicles_cleared: number;
    throughput_vpm: number;
  };
  traffiq_adaptive_results: {
    avg_waiting_time_sec: number;
    avg_queue_length: number;
    total_delay_sec: number;
    vehicles_cleared: number;
    throughput_vpm: number;
  };
  improvements: {
    waiting_time_reduction_percent: number;
    queue_reduction_percent: number;
    throughput_increase_percent: number;
    co2_emissions_saved_kg: number;
  };
  timeline: {
    steps: number[];
    fixed_queue: number[];
    adaptive_queue: number[];
    fixed_wait: number[];
    adaptive_wait: number[];
  };
}

export const api = {
  // Detection
  async uploadVideo(file: File, frameSkip = 2, maxFrames = 150): Promise<DetectionResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('frame_skip', String(frameSkip));
    formData.append('max_frames', String(maxFrames));

    const res = await fetch(`${API_BASE}/detection/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async generateSampleVideo(): Promise<DetectionResult> {
    const res = await fetch(`${API_BASE}/detection/sample-generate`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getDetectorStatus() {
    const res = await fetch(`${API_BASE}/detection/status`);
    return res.json();
  },

  async getLatestDetection(): Promise<DetectionResult | null> {
    const res = await fetch(`${API_BASE}/detection/latest`);
    const data = await res.json();
    return data.status === 'no_video_processed_yet' ? null : data;
  },

  // Signals
  async optimizeSignals(payload: {
    north_vehicles: number;
    south_vehicles: number;
    east_vehicles: number;
    west_vehicles: number;
    emergency_direction?: string | null;
  }) {
    const res = await fetch(`${API_BASE}/signals/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async triggerEmergency(direction: string, vehicle_type = 'ambulance') {
    const res = await fetch(`${API_BASE}/signals/emergency-override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, vehicle_type }),
    });
    return res.json();
  },

  async clearEmergency() {
    const res = await fetch(`${API_BASE}/signals/emergency-clear`, { method: 'POST' });
    return res.json();
  },

  async getEmergencyStatus() {
    const res = await fetch(`${API_BASE}/signals/emergency-status`);
    return res.json();
  },

  // Simulation
  async getSimulationState(): Promise<SimulationState> {
    const res = await fetch(`${API_BASE}/simulation/state`);
    return res.json();
  },

  async startSimulation() {
    const res = await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
    return res.json();
  },

  async pauseSimulation() {
    const res = await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
    return res.json();
  },

  async resetSimulation() {
    const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    return res.json();
  },

  async setSimulationMode(mode: 'adaptive' | 'fixed') {
    const res = await fetch(`${API_BASE}/simulation/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    return res.json();
  },

  async spawnSimulationVehicle(direction: string, vtype = 'car', turn: string = 'STRAIGHT') {
    const res = await fetch(`${API_BASE}/simulation/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, vtype, turn }),
    });
    return res.json();
  },

  async triggerSimulationEmergency(direction: string) {
    const res = await fetch(`${API_BASE}/simulation/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });
    return res.json();
  },

  async getCorridorStatus() {
    const res = await fetch(`${API_BASE}/simulation/corridor`);
    return res.json();
  },

  async getSumoStatus() {
    const res = await fetch(`${API_BASE}/simulation/sumo-status`);
    return res.json();
  },

  // Prediction
  async predictCongestion(params: {
    hour_of_day: number;
    is_weekend: boolean;
    vehicle_count: number;
    current_density_pct: number;
    weather: string;
    prev_cycle_wait: number;
    incident: boolean;
  }) {
    const res = await fetch(`${API_BASE}/prediction/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getPredictionMetrics() {
    const res = await fetch(`${API_BASE}/prediction/metrics`);
    return res.json();
  },

  async retrainModel() {
    const res = await fetch(`${API_BASE}/prediction/retrain`, { method: 'POST' });
    return res.json();
  },

  // Analytics
  async runBenchmark(durationSteps = 120, intensity = 'medium'): Promise<BenchmarkResult> {
    const res = await fetch(`${API_BASE}/analytics/benchmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_steps: durationSteps, intensity }),
    });
    return res.json();
  },

  async getAnalyticsSummary() {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    return res.json();
  },
};
