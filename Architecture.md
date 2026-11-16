# System Architecture Document

## Project: TRAFFIQ — AI-Powered Intelligent Traffic Management System
**Tagline:** Detect. Analyze. Predict. Optimize.  
**Document:** System Architecture & Technical Specifications  
**Version:** 1.0.0  
**Status:** Approved & Implemented  
**Date:** November 2026  

---

## 1. Architectural Principles & System Goals

TRAFFIQ is architected around five fundamental engineering principles:

1. **Strict 100% Software-Only Design:**
   Zero dependency on physical microcontrollers (Arduino, Raspberry Pi, ESP32), physical traffic lights, or roadbed induction sensors. Operates entirely through software computer vision, kinematic simulations, and web interfaces.
2. **Deterministic Safety Guardrails:**
   Physical safety is non-negotiable. Conflicting directions (North-South vs. East-West) can **never** receive green signals concurrently. All phase transitions strictly traverse through Yellow ($4\text{s}$) and All-Red ($3\text{s} + \text{Clearance Guard}$) intervals.
3. **Decoupled Layered Architecture:**
   Presentation, application logic, computer vision, mathematical optimization, and persistence tiers are cleanly decoupled via typed REST APIs and WebSocket streams.
4. **Resilient Dual-Engine Execution:**
   The vision subsystem automatically operates in dual-engine mode: high-precision YOLOv8 deep learning when supported, with a zero-configuration OpenCV background subtraction fallback for low-spec CPU laptops.
5. **Empirical Grounding (Zero Hallucinated Metrics):**
   All metrics (queue lengths, delay, throughput, PCU saturation, and ML predictions) originate from actual mathematical formulations, computer vision contours, or deterministic seeded simulations.

---

## 2. End-to-End System Topology

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                      CLIENT / FRONTEND                                      |
|                                                                                             |
|   +───────────────────────────────────+             +───────────────────────────────────+   |
|   |  Module 4: 2D Canvas Intersection |             |  Module 4: Real Google Maps View  |   |
|   |  - 60 FPS HTML5 Canvas            |             |  - Leaflet.js Geospatial Viewer   |   |
|   |  - Precise Stop-Line Bumper Model |             |  - Google Streets / Satellite     |   |
|   |  - Straight, Left & Right Turns   |             |  - Live Traffic Congestion Heatmap|   |
|   +─────────────────┬─────────────────+             +─────────────────┬─────────────────+   |
|                     │                                                 │                     |
|   +─────────────────▼─────────────────────────────────────────────────▼─────────────────+   |
|   |                      React 19 Single Page Application (Vite 8)                      |   |
|   |  - Clean White & Light Violet UI Theme                                              |   |
|   |  - 11 Module Views: Overview, Detection, Density, Optimizer, Emergency, ML, etc.   |   |
|   |  - Lucide Icons | Recharts Analytics | Tailwind CSS Layouts                         |   |
|   +──────────────────────────────────────────┬──────────────────────────────────────────+   |
+──────────────────────────────────────────────┼──────────────────────────────────────────────+
                                               │
                   HTTP/1.1 REST (JSON)        │        WebSocket Stream
                   [Port 8000 /api/*]          │        [ws://localhost:8000/ws/simulation]
                                               │
+──────────────────────────────────────────────▼──────────────────────────────────────────────+
|                                    BACKEND APPLICATION                                     |
|                                   FastAPI / Uvicorn ASGI                                    |
|                                                                                             |
|   +───────────────────────+  +───────────────────────+  +───────────────────────────────+   |
|   | API Routers           |  | WebSocket Broadcast   |  | Background Simulation Ticker  |   |
|   | - routes_detection    |  | - Active client pool  |  | - dt = 0.3s (3.33 Hz)         |   |
|   | - routes_signals      |  | - Real-time telemetry |  | - Safe thread locks           |   |
|   | - routes_simulation   |  | - JSON serialization  |  | - Continuous physics step     |   |
|   | - routes_prediction   |  |                       |  |                               |   |
|   | - routes_analytics    |  |                       |  |                               |   |
|   +───────────┬───────────+  +───────────┬───────────+  +───────────────┬───────────────+   |
|               │                          │                              │                   |
|   +───────────▼──────────────────────────▼──────────────────────────────▼───────────────+   |
|   |                                CORE SYSTEM MODULES                                  |   |
|   |                                                                                     |   |
|   |  +─────────────────────────+  +─────────────────────────+  +─────────────────────+  |   |
|   |  | Module 1: AI Vision     |  | Module 2: Density PCU   |  | Module 3: Optimizer |  |   |
|   |  | - YOLOv8n Object Det.   |  | - PCU Conversion Matrix |  | - Webster Equisat.  |  |   |
|   |  | - OpenCV MOG2 Fallback  |  | - Spatial Queue Meter   |  | - Starvation Aging  |  |   |
|   |  | - Centroid/IoU Tracker  |  | - Saturation Percent    |  | - Clearance Guard   |  |   |
|   |  +─────────────────────────+  +─────────────────────────+  +─────────────────────+  |   |
|   |                                                                                     |   |
|   |  +─────────────────────────+  +─────────────────────────+  +─────────────────────+  |   |
|   |  | Module 4: Kinematics    |  | Module 5: Emergency SM  |  | Module 6: ML Predict|  |   |
|   |  | - Intelligent Driver IDM|  | - Priority Preemption   |  | - Random Forest Reg.|  |   |
|   |  | - Turning Trajectories  |  | - Safe Transition Decel |  | - Random Forest Clf.|  |   |
|   |  | - Stop-Line Projection  |  | - Preemption Audit Log  |  | - 6-Hour Trend      |  |   |
|   |  +─────────────────────────+  +─────────────────────────+  +─────────────────────+  |   |
|   |                                                                                     |   |
|   |  +──────────────────────────────────────────────────────+  +─────────────────────+  |   |
|   |  | Module 7: Multi-Junction & Eclipse SUMO Bridge       |  | Module 8: Benchmark |  |   |
|   |  | - 3-Junction Synchronized Corridor (Green Wave Off.) |  | - Fixed vs Adaptive |  |   |
|   |  | - TraCI Connector & XML Scenario Exporter            |  | - Seeded Evaluation |  |   |
|   |  +──────────────────────────────────────────────────────+  +─────────────────────+  |   |
|   +──────────────────────────────────────────┬──────────────────────────────────────────+   |
+──────────────────────────────────────────────┼──────────────────────────────────────────────+
                                               │
+──────────────────────────────────────────────▼──────────────────────────────────────────────+
|                                     PERSISTENCE LAYER                                       |
|                  SQLAlchemy ORM with SQLite (PostgreSQL Ready Database)                     |
|   Tables: Intersections | VideoUploads | DetectionLogs | SignalHistory | EmergencyAudits   |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 3. Layered Architectural Decomposition

### 3.1 Presentation Layer (Frontend)
- **Framework:** React 19 SPA running on Vite 8 and TypeScript.
- **Styling Architecture:** Tailwind CSS utilizing design tokens centered on a clean white and light violet aesthetic:
  - Base app surface: `#fbfbfe`
  - Cards and panels: `#ffffff` with `#ede9fe` (`border-violet-100`)
  - Typography: `#2e1065` (`text-violet-950`)
  - Accent: `#7c3aed` (`violet-600`) and `#f5f3ff` (`violet-50`)
- **Graphics & Visualization Sub-layer:**
  1. **HTML5 Canvas Engine (`VirtualIntersectionCanvas.tsx`):**
     - Renders at 60 FPS using standard `requestAnimationFrame`.
     - Displays road surface, crosswalks, stop lines ($98\text{px}$ from center), signal heads, vehicle bounding boxes, directional blinkers, and animated headlights/taillights.
     - Translates continuous simulation meters into screen pixels ($1.0\text{m} \to \text{scale offset}$).
     - Seamlessly overlays Google Streets, Satellite Aerial, and Live Traffic Nav basemaps.
  2. **Geospatial Map Engine (`RealGoogleMapView.tsx`):**
     - Leverages Leaflet.js with live Google Maps tile providers.
     - Projects simulation telemetry onto real-world city landmarks (NYC Times Square, SF Market St, London Oxford Circus, Tokyo Shibuya, New Delhi Connaught Place, Bengaluru MG Road).
     - Renders dynamic congestion polylines (Green $<25\%$, Amber $25\%-55\%$, Red $>55\%$) and live SVG traffic signal heads.

### 3.2 Application & Service Layer (Backend)
- **ASGI Framework:** FastAPI running on Uvicorn.
- **RESTful Endpoints:** Organized into modular route files under `backend/app/api/`:
  - `routes_detection.py`: Video ingestion, frame extraction, detection processing.
  - `routes_signals.py`: Real-time Webster split computation and timing queries.
  - `routes_simulation.py`: Simulation state machine controls (Start, Pause, Resume, Reset, Spawn, Mode, Emergency).
  - `routes_prediction.py`: Random Forest ML forecasting and validation metrics.
  - `routes_analytics.py`: Head-to-head benchmarking between Fixed-Time and Adaptive control.
- **WebSocket Hub:** Broadcasts complete intersection state snapshots to connected frontend clients at $3.33\text{ Hz}$ ($dt = 0.3\text{s}$).

### 3.3 Core Domain Subsystems

#### A. AI Computer Vision Pipeline
```
Raw Video Stream ──► Downsampling (640x360) ──► YOLOv8n / MOG2 ──► Centroid Tracker ──► PCU Density
```
- **Dual-Engine Strategy:** Attempts neural inference via `ultralytics.YOLO("yolov8n.pt")`. If unavailable, automatically activates OpenCV Background Subtractor `cv2.createBackgroundSubtractorMOG2()` with morphological contour filtering.
- **Object Association:** Centroid & IoU association tracker maintains consistent vehicle tracking IDs across frames, calculating speed and approach lane classification.

#### B. Traffic Density & PCU Conversion Engine
- Converts raw vehicle counts into standard **Passenger Car Units (PCU)**:
  $$\text{PCU}_{\text{total}} = (N_{\text{car}} \times 1.0) + (N_{\text{bus}} \times 2.5) + (N_{\text{truck}} \times 3.0) + (N_{\text{moto}} \times 0.5) + (N_{\text{emg}} \times 2.0)$$
- Computes spatial queue length: $L_{\text{queue}} = \text{PCU} \times 6.5\text{m}$.
- Categorizes approach saturation: Low ($<25\%$), Medium ($25-55\%$), High ($55-80\%$), Severe ($>80\%$).

#### C. Adaptive Signal Optimizer
- **Webster Formulation:** Calculates optimum cycle length:
  $$C_{\text{opt}} = \frac{1.5 L + 5}{1 - Y}$$
  with total lost time $L = 14.0\text{s}$ ($2 \times (4\text{s Yellow} + 3\text{s All-Red})$).
- **Dynamic Green Bounds:** Clamped between $G_{\text{min}} = 10\text{s}$ and $G_{\text{max}} = 60\text{s}$.
- **Starvation Elimination Guarantee:** Increments wait counters on held approaches; if an approach waits $\ge 3$ consecutive cycles, its priority is artificially boosted to mandate a phase change.
- **Explainable AI (XAI):** Generates natural-language reasoning explaining the exact traffic distribution and formula decisions behind each phase allocation.

#### D. Kinematic Simulation Engine
- **Intelligent Driver Model (IDM):** Controls vehicle following dynamics with standstill headway buffer $s_0=2.5\text{m}$ and time headway $T=1.2\text{s}$.
- **Stop-Line Adherence:** Front bumpers stop strictly behind the $180.0\text{m}$ stop line (target bumper position $\le 179.5\text{m}$) when facing RED or YELLOW.
- **Intersection Clearance Guard:** If any vehicle or turning car occupies the junction box ($178\text{m} \le \text{pos} \le 222\text{m}$), conflicting traffic is held on ALL RED until the box is completely empty.
- **Turning Trajectories:** Renders realistic deceleration and curved paths for Straight, Left, and Right turns.

#### E. Emergency Priority Preemption
- Engages a safe preemption state machine:
  $$\text{Green} \longrightarrow \text{Yellow (3s)} \longrightarrow \text{All-Red (2.5s)} \longrightarrow \text{Emergency Green Wave (25s)}$$
- Eliminates collision hazards caused by abrupt signal cuts.

#### F. Predictive Machine Learning Engine
- Scikit-Learn Random Forest Classifier (Congestion Level) and Regressor (Density Percentage).
- Evaluates temporal features (Hour, Day, Weekend) and directional volumes to project a 6-hour forward trend.

#### G. Multi-Junction Corridor & SUMO Integration
- Synchronizes three consecutive intersections (J1 North Corridor, J2 Metro Plaza, J3 Tech Park).
- Coordinates Green Wave progression offsets ($8\text{s}$ delta) along arterial corridors.
- Generates standard Eclipse SUMO network files (`.nod.xml`, `.edg.xml`, `.rou.xml`, `.sumocfg`) with TraCI integration.

---

## 4. Key Data Flows & Sequence Diagrams

### 4.1 Real-Time Simulation & Optimization Loop

```
Frontend Canvas                 FastAPI Backend             Webster Optimizer
      │                                │                            │
      │  GET /ws/simulation (Connect)  │                            │
      ├───────────────────────────────►│                            │
      │                                │                            │
      │                                │──┐ (Every dt = 0.3s)       │
      │                                │  │ 1. Update IDM Physics   │
      │                                │  │ 2. Check Stop Lines     │
      │                                │  │ 3. Check Clearance Box  │
      │                                │◄─┘                         │
      │                                │                            │
      │                                │ Phase Time Expired?        │
      │                                │───────────────────────────►│
      │                                │                            │ Calculate Next Green
      │                                │◄───────────────────────────│ via Webster & PCUs
      │                                │                            │
      │  WebSocket Broadcast (JSON)    │                            │
      │◄───────────────────────────────│                            │
      │                                │                            │
      │──┐                             │                            │
      │  │ Render 60 FPS Canvas        │                            │
      │  │ & Update Live Telemetry     │                            │
      │◄─┘                             │                            │
```

### 4.2 Emergency Preemption Sequence Flow

```
User / AI Vision                VirtualIntersection             Signal Heads
      │                                │                            │
      │  POST /api/simulation/emergency│                            │
      ├───────────────────────────────►│                            │
      │                                │ Conflicting Green Active?  │
      │                                │──┐                         │
      │                                │  │ Transition to YELLOW    │
      │                                │◄─┘                         │
      │                                │───────────────────────────►│ Display YELLOW (3s)
      │                                │                            │
      │                                │ Yellow Expired             │
      │                                │──┐                         │
      │                                │  │ Transition to ALL-RED   │
      │                                │◄─┘                         │
      │                                │───────────────────────────►│ Display ALL-RED (2.5s)
      │                                │                            │
      │                                │ Junction Box Empty?        │
      │                                │──┐                         │
      │                                │  │ Clearance Verified      │
      │                                │◄─┘                         │
      │                                │───────────────────────────►│ Display EMERGENCY GREEN (25s)
      │                                │                            │ Conflicting Held RED
      │                                │ Emergency Cleared          │
      │                                │──┐                         │
      │                                │  │ Transition to ALL-RED   │
      │                                │  │ Re-sync Adaptive Cycle  │
      │                                │◄─┘                         │
```

---

## 5. Security, Reliability & Fail-Safe Mechanics

1. **Hardware-Free Fault Isolation:**
   Because the system is strictly software-based, there are no hardware failure modes (e.g., loose breadboard wires, burnt LEDs, sensor drift, or faulty GPIO pins).
2. **Deterministic Mutual Exclusion:**
   North-South and East-West signals are driven by a single phase state machine. Simultaneous conflicting greens are mathematically impossible.
3. **Emergency Preemption Clearance Guard:**
   Emergency overrides never execute an instant-cut transition. Conflicting traffic is granted a mandatory yellow deceleration window followed by an all-red clearance interval to eliminate T-bone collision risks.
4. **Local Execution & Privacy:**
   Video files and telemetry remain completely on the local host machine. No video data or biometric information is transmitted to external cloud APIs.

---

## 6. Verification & Automated Test Architecture

The software architecture is backed by an automated test suite ([tests/](file:///c:/Users/Asus/OneDrive/TRAFFIQ%20Hackathano/tests/)):
- `tests/test_backend.py`: Validates API status codes, response payloads, optimizer calculations, emergency preemption triggers, and ML predictors (8 unit tests).
- `tests/test_simulation_physics.py`: Validates physical vehicle bumper stop line adherence ($180.0\text{m}$), IDM non-overlap gap maintenance, safe phase transitions (`GREEN` $\to$ `YELLOW` $\to$ `ALL-RED` $\to$ `GREEN`), intersection clearance guards, and turning movements (6 unit tests).

**Total Test Coverage:** 14 automated unit tests, 100% passing.
