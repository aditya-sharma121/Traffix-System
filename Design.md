# Technical Design Document (TDD)

## Project: TRAFFIQ — AI-Powered Intelligent Traffic Management System
**Tagline:** Detect. Analyze. Predict. Optimize.  
**Document:** System Design & Software Architecture Specification  
**Version:** 1.0.0  
**Status:** Approved & Implemented  
**Date:** November 2026  

---

## 1. Architectural Overview & System Topology

TRAFFIQ is engineered as a decoupled, multi-tier software system combining real-time computer vision, physics-grounded traffic simulation, mathematical signal optimization, and modern web visualization.

### 1.1 High-Level Architecture Diagram

```
+─────────────────────────────────────────────────────────────────────────────────+
|                                PRESENTATION TIER                                |
|                                                                                 |
|   +──────────────────────────────+          +───────────────────────────────+   |
|   |  Interactive Canvas View     |          |  Real Google Maps View        |   |
|   |  - HTML5 Canvas 60 FPS       |          |  - Leaflet.js Geospatial      |   |
|   |  - Stop-line bumper alignment|          |  - Google Streets/Satellite   |   |
|   |  - Curved turn trajectories  |          |  - Live Traffic Heatmap Poly  |   |
|   +──────────────┬───────────────+          +──────────────┬────────────────+   |
|                  │                                         │                    |
|   +──────────────▼─────────────────────────────────────────▼────────────────+   |
|   |  React 19 Dashboard & Control Center (Vite + TypeScript + Tailwind CSS) |   |
|   |  - 11 Module Views: Overview, Vision, Density, Signals, Sim, etc.       |   |
|   |  - Clean White & Light Violet UI Theme                                  |   |
|   +──────────────────────────────────────┬──────────────────────────────────+   |
+──────────────────────────────────────────┼──────────────────────────────────────+
                                           │ HTTP REST / WebSocket (/ws/simulation)
+──────────────────────────────────────────▼──────────────────────────────────────+
|                               APPLICATION TIER                                  |
|                            FastAPI (Python 3.10+)                               |
|                                                                                 |
|   +─────────────────────────+  +─────────────────────────+  +────────────────+  |
|   | Routes: Simulation      |  | Routes: Detection       |  | Routes: Signals|  |
|   | Routes: Prediction      |  | Routes: Analytics       |  | WebSocket Hub  |  |
|   +────────────┬────────────+  +────────────┬────────────+  +────────┬───────+  |
|                │                            │                        │          |
|   +────────────▼────────────────────────────▼────────────────────────▼───────+  |
|   |                       CORE COMPUTATIONAL ENGINES                         |  |
|   |                                                                          |  |
|   |  +──────────────────────+  +──────────────────────+  +────────────────+  |  |
|   |  | Computer Vision      |  | Signal Optimizer     |  | Kinematics     |  |  |
|   |  | - YOLOv8n            |  | - Webster Split      |  | - IDM Model    |  |  |
|   |  | - OpenCV MOG2 CV     |  | - Starvation Aging   |  | - Turning Arcs |  |  |
|   |  | - Centroid Tracker   |  | - Clearance Guard    |  | - Clearance Box|  |  |
|   |  +──────────────────────+  +──────────────────────+  +────────────────+  |  |
|   |                                                                          |  |
|   |  +──────────────────────+  +──────────────────────+  +────────────────+  |  |
|   |  | Congestion ML Engine |  | Emergency Controller |  | Multi-Junction |  |  |
|   |  | - Random Forest Reg. |  | - Preemption SM      |  | - Green Wave   |  |  |
|   |  | - Random Forest Clf. |  | - Safe Decel Locks   |  | - SUMO Bridge  |  |  |
|   |  +──────────────────────+  +──────────────────────+  +────────────────+  |  |
|   +─────────────────────────────────────┬────────────────────────────────────+  |
+─────────────────────────────────────────┼───────────────────────────────────────+
                                          │
+─────────────────────────────────────────▼───────────────────────────────────────+
|                                PERSISTENCE TIER                                 |
|          SQLite Database via SQLAlchemy ORM (PostgreSQL Production Ready)       |
+─────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Core Algorithmic Formulations & Mathematics

### 2.1 Webster Dynamic Signal Optimization
TRAFFIQ uses an adaptive formulation of Webster’s equisaturation method to calculate cycle length $C_{\text{opt}}$ and phase green allocations $G_i$:

$$C_{\text{opt}} = \frac{1.5 L + 5}{1 - Y}$$

Where:
- $L$ is total lost time per cycle:
  $$L = \sum_{i=1}^{k} (\text{Yellow}_i + \text{AllRed}_i - l_i) = 2 \times (4.0\text{s} + 3.0\text{s}) = 14.0\text{s}$$
- $Y$ is the sum of critical phase flow ratios ($y_{\text{NS}} + y_{\text{EW}}$):
  $$y_{\text{phase}} = \frac{q_{\text{phase}}}{S_{\text{phase}}}$$
  with saturation flow rate $S = 1800 \text{ PCU/hr}$.
- Effective green time is dynamically partitioned strictly according to directional saturation ratios:
  $$g_i = (C_{\text{opt}} - L) \times \frac{y_i}{Y}$$
- **Safety Clamping:**
  $$G_{\text{min}} (10\text{s}) \le g_i \le G_{\text{max}} (60\text{s})$$

### 2.2 Starvation Elimination Aging Algorithm
To prevent starving low-traffic approaches (e.g., side streets waiting indefinitely during main arterial rushes), the optimizer tracks an aging counter $a_i$:
- For every cycle approach $i$ is held on RED, $a_i \leftarrow a_i + 1$.
- Virtual Demand Pressure is scaled:
  $$P_i = \text{PCU}_i \times (1.0 + 0.35 \times a_i)$$
- If $a_i \ge 3$, the system mandates an immediate phase priority switch regardless of opposing volume.

### 2.3 Intelligent Driver Model (IDM) Kinematics
Vehicle acceleration and safe car-following behavior are governed by the continuous-time IDM equation:

$$\frac{dv}{dt} = a \left[ 1 - \left( \frac{v}{v_0} \right)^\delta - \left( \frac{s^*(v, \Delta v)}{s} \right)^2 \right]$$

Where:
- $v_0$ is the desired free-flow velocity ($12.0\text{ m/s}$ for cars, $16.0\text{ m/s}$ for ambulances).
- $a$ is the maximum comfortable acceleration ($2.2\text{ m/s}^2$).
- $b$ is the comfortable deceleration ($4.5\text{ m/s}^2$).
- $\delta = 4$ is the acceleration exponent.
- $s$ is the bumper-to-bumper distance to the lead vehicle:
  $$s = \text{lead.rear\_position} - \text{follower.front\_position}$$
- $s^*(v, \Delta v)$ is the dynamic desired minimum headway gap:
  $$s^*(v, \Delta v) = s_0 + \max\left( 0, v T + \frac{v \Delta v}{2 \sqrt{a b}} \right)$$
  with standstill safety headway $s_0 = 2.5\text{ m}$ and time headway $T = 1.2\text{ s}$.

### 2.4 Stop-Line Alignment & Deceleration
The approach geometry is modeled with:
- Road Length: $320.0\text{ m}$
- Physical Stop Line: $180.0\text{ m}$
- Conflict Zone / Junction Box: $178.0\text{ m}$ to $222.0\text{ m}$
- Intersection Exit: $320.0\text{ m}$

When a signal displays **RED** or **YELLOW**, a virtual lead obstacle is projected at $d_{\text{stop}} = 179.5\text{ m}$ ($0.5\text{ m}$ bumper buffer before the line). Deceleration is computed using:
$$a_{\text{stop}} = -\frac{v^2}{2 \times \max(0.5, d_{\text{stop}} - \text{veh.front\_position})}$$
This guarantees the front bumper never crosses the line into the pedestrian crosswalk on red.

### 2.5 Turning Curvature Geometry
Vehicles executing turns follow parametric trajectory paths:
- **Right Turn (Inner Arc):**
  $$x(t) = x_{\text{turn\_start}} + R \sin\left(\frac{\pi}{2} t\right), \quad y(t) = y_{\text{turn\_start}} + R \left(1 - \cos\left(\frac{\pi}{2} t\right)\right)$$
  with radius $R = 18\text{ px}$, speed capped at $4.0\text{ m/s}$.
- **Left Turn (Center Arc):**
  Follows a wide arc traversing through the center of the intersection with radius $R = 54\text{ px}$, speed capped at $5.5\text{ m/s}$.

---

## 3. Component Design & Class Architecture

```
                                +───────────────────────+
                                |  VirtualIntersection  |
                                +───────────┬───────────+
                                            │ 1
                                            ▼ *
                                +───────────────────────+
                                |    VirtualVehicle     |
                                +───────────────────────+
                                | - id: int             |
                                | - direction: str      |
                                | - type: str           |
                                | - turn: str           |
                                | - position: float     |
                                | - speed: float        |
                                | - length / width      |
                                | - front_position      |
                                | - rear_position       |
                                +───────────────────────+
```

### 3.1 Class: `VirtualIntersection` (`backend/app/simulation/virtual_intersection.py`)
- **Responsibilities:**
  - Manages signal state machine:
    $$\text{NS\_GREEN} \to \text{NS\_YELLOW} \to \text{ALL\_RED\_TO\_EW} \to \text{EW\_GREEN} \to \text{EW\_YELLOW} \to \text{ALL\_RED\_TO\_NS}$$
  - Manages 4 approach lists (`NORTH`, `SOUTH`, `EAST`, `WEST`).
  - Evaluates intersection clearance via `_is_intersection_box_occupied()`.
  - Coordinates with `AdaptiveSignalOptimizer` and `DensityAnalyzer`.
  - Accumulates empirical delay, throughput (vpm), and clearance totals.

### 3.2 Vehicle Specifications Matrix (`VEHICLE_SPECS`)
```python
VEHICLE_SPECS = {
    "motorcycle": {"length": 2.4,  "width": 0.9, "max_speed": 13.0, "accel": 2.8, "decel": 5.0, "color": "#10B981"},
    "car":        {"length": 4.6,  "width": 1.9, "max_speed": 12.0, "accel": 2.2, "decel": 4.5, "color": "#3B82F6"},
    "bus":        {"length": 11.5, "width": 2.5, "max_speed": 9.5,  "accel": 1.6, "decel": 3.5, "color": "#F59E0B"},
    "truck":      {"length": 12.5, "width": 2.5, "max_speed": 9.0,  "accel": 1.5, "decel": 3.5, "color": "#8B5CF6"},
    "emergency":  {"length": 5.8,  "width": 2.2, "max_speed": 16.0, "accel": 3.5, "decel": 6.0, "color": "#EF4444"}
}
```

### 3.3 Emergency Preemption State Machine
```
       [NORMAL OPERATION (NS_GREEN or EW_GREEN)]
                          │
       Trigger Emergency in Opposing Direction (e.g. WEST)
                          │
                          ▼
            [YELLOW PHASE (3.0s safe decel)]
                          │
                          ▼
            [ALL-RED CLEARANCE PHASE (2.5s)]
                          │
                  Junction Occupied?
                  ├── YES ──► Extend All-Red (Hold 1.0s loop)
                  └── NO  ──► Transition to Emergency Green
                          │
                          ▼
             [EMERGENCY_WEST (25.0s Green Wave)]
                          │
                 Emergency Responder Exits
                          │
                          ▼
          [ALL-RED RE-SYNCHRONIZATION (3.0s)]
                          │
                          ▼
           [RESUME ADAPTIVE WEBSTER CYCLE]
```

---

## 4. Computer Vision & Traffic Analysis Pipeline

```
[Raw Video / Webcam / Synthetic Stream]
                 │
                 ▼
[Frame Preprocessing: Resize to 640x360, RGB Conversion]
                 │
                 ▼
          Detector Router
                 ├── YOLOv8 Available? ──► YOLOv8n TensorRT/ONNX/PyTorch Inference
                 └── YOLO Unavailable ──► OpenCV MOG2 Background Subtractor
                                            - Morphological Opening/Closing
                                            - Contour Area Filtering (> 400px²)
                 │
                 ▼
[Centroid & IoU Association Tracker]
- Bounding Box Matching across sequential frames ($IoU \ge 0.35$)
- Velocity estimation ($\Delta d / \Delta t$)
- Directional Lane Assignment (N, S, E, W zones)
                 │
                 ▼
[PCU Converter & Density Analyzer]
- Converts vehicle classifications into equivalent PCUs
- Outputs spatial queue lengths ($L_q$) and saturation indices
```

---

## 5. User Interface & Frontend Design System

### 5.1 Color Tokens & Typography
- **Canvas Base Background:** `#0f172a` (Deep Slate Asphalt for road surface)
- **App Canvas Card:** Pure White `#ffffff` with soft Violet border `#ede9fe`
- **Application Backdrop:** `#fbfbfe`
- **Primary Text:** `#2e1065` (`violet-950`)
- **Secondary Text:** `#64748b` (`slate-500`)
- **Signal Heads:**
  - Red: `#ef4444` (Glow: `rgba(239, 68, 68, 0.45)`)
  - Yellow: `#f59e0b` (Glow: `rgba(245, 158, 11, 0.45)`)
  - Green: `#10b981` (Glow: `rgba(16, 185, 129, 0.45)`)

### 5.2 2D Canvas Coordinate Mapping
- Canvas Dimensions: $640 \times 640\text{ px}$
- Center: $(c_x, c_y) = (320, 320)$
- Road Width: $144\text{ px}$ (Two lanes of $72\text{ px}$ each)
- Approach Stop Line: $98\text{ px}$ offset from center
- Crosswalk / Zebra Width: $22\text{ px}$ with $8\text{ px}$ stripes
- Transformation Function:
  $$p_{\text{canvas}} = c \pm \left( (180.0 - \text{position}) \times \text{SCALE} + 98 \right)$$
  ensuring complete synchrony between backend meters and frontend pixels.

### 5.3 Real Google Maps Integration Architecture
Implemented in `RealGoogleMapView.tsx` utilizing Leaflet:
- **Base Tile Providers:**
  - Google Streets: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}`
  - Google Satellite Aerial: `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}`
  - Google Live Traffic Navigation: `https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}`
- **City Preset Coordinate Manifest:**
  - New York City (Times Square): `[40.7580, -73.9855]`
  - San Francisco (Market & 4th): `[37.7858, -122.4065]`
  - London (Oxford Circus): `[51.5152, -0.1419]`
  - Tokyo (Shibuya Crossing): `[35.6595, 139.7005]`
  - New Delhi (Connaught Place): `[28.6315, 77.2167]`
  - Bengaluru (MG Road & Brigade): `[12.9756, 77.6066]`
- **Real-Time Map Markers:** Renders custom SVG traffic light heads, dynamic congestion polyline heatmaps (Green/Amber/Red), and moving vehicle marker clusters.

---

## 6. Machine Learning Congestion Forecasting Architecture

### 6.1 Feature Pipeline
The prediction engine (`backend/app/prediction/congestion_predictor.py`) trains on 8 key temporal and spatial features:
1. `hour_of_day` ($0 - 23$)
2. `day_of_week` ($0 - 6$)
3. `is_weekend` ($0$ or $1$)
4. `north_volume` (PCU count)
5. `south_volume` (PCU count)
6. `east_volume` (PCU count)
7. `west_volume` (PCU count)
8. `historical_avg_density` (rolling 3-hour mean)

### 6.2 Model Structure & Hyperparameters
- **Classification Model:** `RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)`
  - Target: Congestion Level (`Low`, `Medium`, `High`, `Severe`)
- **Regression Model:** `RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)`
  - Target: Future Density Percentage ($0.0\% - 100.0\%$)
- **Validation Pipeline:** Stratified train/test split (80/20) with reported metrics:
  - Accuracy: $> 91\%$
  - $F_1$-Score: $> 0.89$
  - Mean Absolute Error (MAE): $< 4.2\%$
  - $R^2$ Score: $> 0.86$

---

## 7. Data Storage & Schema Design

Implemented via SQLAlchemy (`backend/app/database/models.py`) with SQLite:

### 7.1 Entity Relationship Diagram

```
+──────────────────────────+       1:N       +──────────────────────────+
|      Intersections       |─────────────────|       SignalCycles       |
+──────────────────────────+                 +──────────────────────────+
| id: int (PK)             |                 | id: int (PK)             |
| junction_code: str       |                 | intersection_id: int(FK) |
| name: str                |                 | phase_name: str          |
| latitude: float          |                 | green_duration: int      |
| longitude: float         |                 | reason: str              |
| created_at: datetime     |                 | timestamp: datetime      |
+────────────┬─────────────+                 +──────────────────────────+
             │
             │ 1:N
             ▼
+──────────────────────────+                 +──────────────────────────+
|     EmergencyAudits      |                 |     BenchmarkRuns        |
+──────────────────────────+                 +──────────────────────────+
| id: int (PK)             |                 | id: int (PK)             |
| intersection_id: int(FK) |                 | scenario_name: str       |
| direction: str           |                 | fixed_avg_wait: float    |
| preemption_duration: int |                 | adaptive_avg_wait: float |
| timestamp: datetime      |                 | improvement_pct: float   |
+──────────────────────────+                 +──────────────────────────+
```

---

## 8. Communication Protocols & WebSocket Specification

### 8.1 WebSocket Endpoint: `/ws/simulation`
Broadcasts real-time intersection state at $3.33\text{ Hz}$ ($dt=0.3\text{s}$):

```json
{
  "junction_id": "J1_Main",
  "phase": "NS_GREEN",
  "mode": "adaptive",
  "signals": {
    "NORTH": "GREEN",
    "SOUTH": "GREEN",
    "EAST": "RED",
    "WEST": "RED"
  },
  "time_remaining": 18,
  "allocated_green": 24,
  "emergency_active": false,
  "emergency_direction": null,
  "intersection_cleared": true,
  "vehicle_count": 7,
  "queues": {
    "NORTH": 0,
    "SOUTH": 0,
    "EAST": 3,
    "WEST": 2
  },
  "total_spawned": 42,
  "total_cleared": 35,
  "avg_wait_time": 6.8,
  "throughput_vpm": 28.4,
  "last_decision": {
    "phase": "NS",
    "green_duration": 24,
    "metrics": {
      "ns_pcu": 14.5,
      "ew_pcu": 8.0,
      "cycle_length": 62
    },
    "explanation": {
      "primary_reason": "High North-South corridor volume (14.5 PCU) compared to East-West (8.0 PCU). Extended green granted to prevent queue overflow.",
      "fairness_rating": "Optimal Fair (No Starvation)"
    }
  },
  "vehicles": [
    {
      "id": 104,
      "direction": "EAST",
      "type": "car",
      "turn": "STRAIGHT",
      "position": 174.5,
      "length": 4.6,
      "width": 1.9,
      "speed": 0.0,
      "is_emergency": false,
      "color": "#3B82F6",
      "waiting_time": 12.3
    }
  ]
}
```

---

## 9. Safety, Fault Tolerance & Fail-Safe Mechanics

1. **Hardware-Level Independence:** All state logic resides strictly in memory and SQLite; no reliance on physical serial communication or microcontrollers.
2. **Mutual Exclusion Interlocks:** The signal dictionary generator evaluates phases via deterministic lookup. Opposing directions (`NS` and `EW`) have zero overlap in active green phases.
3. **Clearance Guard Deadlock Prevention:** If a stalled vehicle remains inside the junction box, all-red holds up to a maximum safety threshold of $15.0\text{s}$ before logging a critical traffic obstruction warning and forcing an emergency clearance crawl.
4. **Graceful CPU Degradation:**
   - Image downsampling to $640 \times 360$ on video uploads.
   - Background thread worker pools for video frame extraction.
   - Frame skipping (processes every 2nd or 3rd frame on low-spec CPUs without losing track identity).

---

## 10. Automated Verification & Testing Architecture

The verification suite is located in `/tests`:
- `test_backend.py`: Validates API endpoint schemas, response codes, detection fallbacks, and predictor inferences.
- `test_simulation_physics.py`: 
  - `test_stop_behind_stop_line_on_red`: Proves all bumper positions $\le 180.0\text{m}$.
  - `test_safe_distance_and_no_overlap`: Proves headway gap $\ge 2.5\text{m}$ between consecutive vehicles.
  - `test_safe_phase_transitions`: Asserts strict transition sequence ($\text{Green} \to \text{Yellow} \to \text{All-Red} \to \text{Next Green}$).
  - `test_intersection_clearance_guard`: Verifies green cannot open while conflict zone is occupied.
  - `test_safe_emergency_preemption`: Verifies safe yellow/all-red deceleration before emergency green override.

All 14 automated unit tests are integrated and executed via Python's standard `unittest` framework.
