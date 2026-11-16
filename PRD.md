# Product Requirements Document (PRD)

## Project: TRAFFIQ — AI-Powered Intelligent Traffic Management System
**Tagline:** Detect. Analyze. Predict. Optimize.  
**Version:** 1.0.0 (Hackathon & Production Release)  
**Status:** Approved & Implemented  
**Date:** November 2026  
**Document Owner:** TRAFFIQ Engineering & AI Architecture Team  

---

## 1. Executive Summary

### 1.1 Product Vision
**TRAFFIQ** is an autonomous, software-only intelligent traffic management platform that transforms urban intersections through real-time computer vision, Webster delay-minimization signal optimization, machine learning congestion forecasting, and emergency priority corridor control.

### 1.2 Problem Statement
Traditional municipal traffic signal networks rely on rigid, fixed-timer cycle schedules (e.g., static 30-second cycles) configured decades ago. These static systems cannot adapt to asymmetric traffic flows, resulting in:
- Severe gridlock and unnecessary red-light idling while opposing lanes remain vacant.
- Excessive vehicle fuel consumption and elevated greenhouse gas emissions ($CO_2$).
- Life-threatening transit delays for ambulances, fire engines, and police responders stuck behind queued civilian vehicles.
- Lack of predictive forecasting to proactively route traffic before congestion peaks occur.

### 1.3 Solution Overview
TRAFFIQ delivers an end-to-end, software-driven traffic management ecosystem that replaces physical hardware-dependent infrastructure with AI:
1. **Detects** vehicles from recorded video, aerial feeds, or simulated traffic using YOLOv8 with an OpenCV fallback.
2. **Analyzes** approach densities, queue lengths, and Passenger Car Unit (PCU) saturation across four directional approaches (North, South, East, West).
3. **Optimizes** signal timings dynamically using an enhanced Webster equisaturation algorithm with explainable reasoning.
4. **Predicts** future congestion trends 6 hours ahead using Scikit-Learn Random Forest models.
5. **Simulates** vehicle kinematics with the Intelligent Driver Model (IDM), zero-overlap collision avoidance, turning movements, and safe phase transitions.
6. **Prioritizes** emergency responders via a preemption protocol that transitions safely through yellow and all-red clearance intervals.
7. **Visualizes** intersection operations both through a high-precision 2D canvas and an interactive Real Google Maps geospatial view.

---

## 2. Core Objectives & Success Metrics

| Metric / Objective | Target | Rationale & Measurement Method |
| :--- | :--- | :--- |
| **Average Delay Reduction** | **20% – 35%** | Measured against a fixed 30-second timer on identical seeded vehicle arrival streams. |
| **Emergency Clearance Time** | **< 15 seconds** | Time elapsed between preemption trigger and full corridor green clearance. |
| **Zero-Overlap Collision Safety** | **100% Collision-Free** | Enforced via Intelligent Driver Model ($s_0=2.5\text{m}$ buffer) and stop-line clearance guard. |
| **Conflicting Green Separation** | **0 Conflict Violations** | Mathematically impossible for NS and EW to receive green simultaneously. |
| **Inference & Simulation Rate** | **$\ge$ 30 FPS on CPU** | Runs smoothly on standard laptop CPUs without dedicated GPU hardware. |
| **API Response Latency** | **< 50 ms** | FastAPI endpoints respond within 50ms for signal state and telemetry polling. |

---

## 3. Strict 100% Software-Only Requirement

TRAFFIQ is architected strictly as a **software-only** solution to ensure zero hardware procurement barriers, rapid deployment, and universal portability:

- ❌ **No physical microcontrollers:** No Arduino, Raspberry Pi, ESP32, or STM32 boards.
- ❌ **No physical sensors:** No inductive road loops, ultrasonic sensors, or PIR detectors.
- ❌ **No physical traffic lights:** No breadboard LEDs, relays, or miniature plastic models.
- ❌ **No physical CCTV dependency:** Accepts uploaded MP4/AVI videos, webcam streams, or built-in synthetic aerial footage.
- ✅ **Standard Laptop Compatible:** Fully runnable on a Windows/macOS/Linux laptop utilizing standard Python 3.10+ and Node.js environments.

---

## 4. User Personas & Target Audiences

1. **Municipal Traffic Engineer & Urban Planner:**
   - Needs empirical performance metrics (delay, throughput, PCU capacity) to evaluate signal efficiency and identify bottleneck corridors.
2. **Emergency Services Dispatcher (Ambulance / Fire / Police):**
   - Requires one-click or automated green wave corridor preemption with safe transition locks.
3. **Smart City Operations Commander:**
   - Monitors centralized multi-junction corridors, congestion forecasts, and system health from a unified command center.
4. **Hackathon Judge & Code Evaluator:**
   - Expects an intuitive, aesthetic UI, demonstrable live features, verified physics, and transparent Explainable AI decisions without fabricated metrics.

---

## 5. Functional Requirements by Module

### Module 1: AI Vehicle Detection & Tracking
- **FR-1.1 Video Ingestion:** Accept user-uploaded traffic footage (MP4, AVI, MOV), live webcam feeds, or bundled synthetic benchmark footage.
- **FR-1.2 Detection Engine:** Primary inference via YOLOv8 (`yolov8n.pt`). If Ultralytics weights or PyTorch GPU are unavailable, automatically fallback to OpenCV background subtraction (MOG2) with contour filtering.
- **FR-1.3 Multi-Class Support:** Detect and classify five distinct vehicle categories:
  - *Car* (PCU: 1.0)
  - *Bus* (PCU: 2.5)
  - *Truck* (PCU: 3.0)
  - *Motorcycle* (PCU: 0.5)
  - *Emergency Vehicle* (PCU: 2.0)
- **FR-1.4 Centroid Tracking:** Assign persistent unique integer IDs to vehicles across frames, tracking speeds and trajectories across directional bounding zones.
- **FR-1.5 Honest Metrics:** No fabricated detection numbers. If zero vehicles are present, display 0.

### Module 2: Directional Traffic Density & Queue Analysis
- **FR-2.1 Directional Partitioning:** Segment intersection approaches into North, South, East, and West lanes.
- **FR-2.2 PCU Computation:** Calculate total Passenger Car Units per approach:
  $$\text{PCU}_{\text{total}} = \sum (N_i \times W_i)$$
- **FR-2.3 Spatial Queue Length:** Estimate queue lengths in meters based on physical vehicle lengths plus headway buffers ($L_{\text{queue}} = \text{PCU} \times 6.5\text{m}$).
- **FR-2.4 Saturation & Congestion Classification:**
  - *Low Congestion:* $< 25\%$ Saturation
  - *Medium Congestion:* $25\% - 55\%$ Saturation
  - *High Congestion:* $55\% - 80\%$ Saturation
  - *Severe Gridlock:* $> 80\%$ Saturation

### Module 3: Adaptive Traffic Signal Optimization (Core Engine)
- **FR-3.1 Webster Delay Minimization:** Dynamically allocate green duration based on critical flow ratios:
  $$C_{\text{opt}} = \frac{1.5 L + 5}{1 - Y}$$
  where $L$ is total lost time and $Y$ is the sum of directional saturation ratios ($y_{\text{NS}} + y_{\text{EW}}$).
- **FR-3.2 Safe Operational Bounds:**
  - Minimum Green ($G_{\text{min}}$): $10\text{s}$ (guarantees safe pedestrian crosswalk clearance).
  - Maximum Green ($G_{\text{max}}$): $60\text{s}$ (prevents indefinite red hold on opposing approaches).
  - Yellow Interval: $4\text{s}$ (safe deceleration phase).
  - All-Red Interval: $3\text{s} + \text{Clearance Guard}$ (ensures junction is empty before conflicting green opens).
- **FR-3.3 Starvation Elimination:** Track consecutive wait cycles for unserved directions. If an approach waits $\ge 3$ consecutive cycles, force immediate priority aging.
- **FR-3.4 Explainable AI (XAI):** Accompany every timing decision with natural language reasoning detailing why a specific phase and duration were selected.

### Module 4: Virtual 4-Way Intersection Simulation & Maps
- **FR-4.1 Physics-Grounded Kinematics:** Vehicles follow the **Intelligent Driver Model (IDM)**:
  $$a = a_{\text{max}} \left[ 1 - \left( \frac{v}{v_0} \right)^\delta - \left( \frac{s^*(v, \Delta v)}{s} \right)^2 \right]$$
  maintaining safe headway distance ($s_0=2.5\text{m}$, $T=1.2\text{s}$).
- **FR-4.2 Stop-Line Adherence:** Front bumpers stop strictly behind the $180.0\text{m}$ stop line on Red signals ($179.5\text{m}$ target bumper position, zero zebra crossing encroachment).
- **FR-4.3 Zero Overlap:** Physical bounding boxes must never overlap across all vehicle classes.
- **FR-4.4 Intersection Clearance Guard:** Opposing signals remain locked on ALL RED if any vehicle or turning car occupies the conflict zone ($178\text{m} \le \text{pos} \le 222\text{m}$).
- **FR-4.5 Turning Movements:** Realistic trajectories for:
  - `STRAIGHT`: Through movement across the junction.
  - `RIGHT`: Smooth inner curvature turning right.
  - `LEFT`: Deceleration and wide arc through intersection center turning left.
- **FR-4.6 Real Google Maps Integration:** Dual view modes:
  - *4-Way Junction Canvas:* 2D top-down simulation with Google Streets, Satellite Aerial, and Live Traffic Nav basemaps.
  - *Real Google Map:* Interactive Leaflet map displaying real city coordinates (NYC Times Square, SF Market St, London Oxford Circus, Tokyo Shibuya, New Delhi Connaught Place, Bengaluru MG Road) with live signal heads and traffic polyline heatmaps.
- **FR-4.7 Simulation Controls:** Start, Pause, Resume, Reset, and Manual Vehicle Injection (Direction, Vehicle Type, Turn Intention).

### Module 5: Emergency Vehicle Priority Protocol
- **FR-5.1 Emergency Preemption:** Identify incoming emergency responders and override regular cycle scheduling.
- **FR-5.2 Safe Transition Guardrail:** If opposing traffic has green, transition through Yellow ($3\text{s}$) $\to$ All-Red ($2.5\text{s}$) before granting emergency green (no instantaneous cuts causing accidents).
- **FR-5.3 Corridor Green Wave:** Maintain green along the emergency vehicle's direction until the responder has fully cleared the junction.
- **FR-5.4 Dispatch Override:** UI buttons for manual ambulance injection (North, West) for hackathon demonstrations.

### Module 6: Predictive Traffic Congestion Engine
- **FR-6.1 Supervised Learning Models:**
  - Random Forest Classifier (predicts Congestion Level: Low, Medium, High, Severe).
  - Random Forest Regressor (predicts continuous density percentage).
- **FR-6.2 Feature Set:** Hour of day, day of week, directional volume, current density, historical moving averages, and weather/event flags.
- **FR-6.3 Forecast Horizon:** Provide 6-hour forward congestion projections.
- **FR-6.4 Validation Metrics:** Report empirical model accuracy, F1-score, Mean Absolute Error (MAE), Mean Squared Error (MSE), and $R^2$ score.

### Module 7: Multi-Junction Corridor & SUMO Bridge
- **FR-7.1 3-Junction Arterial Network:** Synchronize three consecutive intersections (J1 North Corridor, J2 Metro Plaza, J3 Tech Park).
- **FR-7.2 Green Wave Coordination:** Apply an 8-second phase offset along the main arterial corridor to minimize stop-and-go propagation.
- **FR-7.3 Eclipse SUMO Bridge:** Export standard Eclipse SUMO network and route configurations (`.nod.xml`, `.edg.xml`, `.rou.xml`, `.sumocfg`) with optional TraCI execution.
- **FR-7.4 Native Python Fallback:** If SUMO is not installed, seamlessly run the built-in multi-junction simulation.

### Module 8: Performance Analytics & Benchmarking
- **FR-8.1 Head-to-Head Benchmark:** Compare Traditional Fixed-Time Signals ($30\text{s}$) against TRAFFIQ Adaptive Control on identical seeded vehicle arrival streams.
- **FR-8.2 Measurable Metrics:**
  - Average Waiting Time per vehicle (seconds).
  - Average Queue Length (meters and vehicle count).
  - Intersection Throughput (vehicles per minute).
  - Estimated Idle Fuel and $CO_2$ Emission Reductions.
- **FR-8.3 Scientific Integrity:** Use deterministic test seeds and report measured outcomes without arbitrary multiplier fabrication.

---

## 6. User Interface & Design Specifications

### 6.1 Color Palette & Theme
The user interface adheres to a **Clean White & Light Violet** modern aesthetic:
- **Primary Background:** `#fbfbfe` (Soft crystalline off-white)
- **Card Surfaces:** `#ffffff` (Pure white with `border-violet-100/90`)
- **Primary Accent:** `violet-600` (`#7c3aed`), `violet-700` (`#6d28d9`)
- **Secondary Light Accents:** `violet-50` (`#f5f3ff`), `violet-100` (`#ede9fe`)
- **Typography:** `text-violet-950` (`#2e1065`) for primary headings, `text-slate-600` for body copy.
- **Status Accents:** Emerald (`#10b981`) for Green/Active, Amber (`#f59e0b`) for Yellow/Warning, Rose/Red (`#ef4444`) for Red/Emergency.

### 6.2 Application Navigation Structure
The application features 11 dedicated, responsive views accessible via a sidebar:
1. **Overview Dashboard:** Executive summary, key KPIs, live intersection state, emergency notices.
2. **Live Monitoring:** Real-time multi-angle camera feeds and intersection status.
3. **AI Vehicle Detection:** Video upload portal, processing stream, and bounding box playback.
4. **Density Analysis:** PCU calculations, queue length charts, saturation meters.
5. **Adaptive Signal Control:** Live signal timings, Webster split calculator, and AI reasoning logs.
6. **Virtual 4-Way Intersection:** Canvas simulation, Real Google Maps view, and vehicle spawn controls.
7. **Emergency Management:** Preemption dashboard, live audit log, and dispatch buttons.
8. **Congestion Prediction:** 6-hour ML forecasts, feature importance charts, model evaluation.
9. **Multi-Junction Corridor:** 3-junction corridor progression, green wave synchronization.
10. **Performance Analytics:** Fixed-Time vs TRAFFIQ Adaptive comparison reports and charts.
11. **Documentation & Architecture:** Interactive system reference, user guides, and API schemas.

---

## 7. Technical Architecture & Technology Stack

```
+─────────────────────────────────────────────────────────────────────────+
|                           FRONTEND LAYER                                |
|  React 19 | TypeScript | Vite | Tailwind CSS | Recharts | Lucide Icons  |
|  HTML5 Canvas Simulation Engine | Leaflet.js Real Google Maps Overlays  |
+────────────────────────────────────┬────────────────────────────────────+
                                     │ HTTP REST / WebSocket (/ws)
+────────────────────────────────────▼────────────────────────────────────+
|                            BACKEND LAYER                                |
|   FastAPI (Asynchronous) | Uvicorn ASGI Server | SQLAlchemy | SQLite     |
+────────────────────────────────────┬────────────────────────────────────+
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
+───────────────+             +───────────────+             +───────────────+
|  AI / VISION  |             | OPTIMIZATION  |             |  ML / STATS   |
|  YOLOv8       |             | Webster Split |             | Scikit-Learn  |
|  OpenCV MOG2  |             | IDM Physics   |             | Random Forest |
|  ByteTrack    |             | SUMO / TraCI  |             | NumPy, Pandas |
+───────────────+             +───────────────+             +───────────────+
```

### 7.1 Tech Stack Summary
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Leaflet, HTML5 Canvas.
- **Backend:** Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, SQLite, WebSockets.
- **Computer Vision:** OpenCV (`cv2`), Ultralytics YOLOv8 (`yolov8n.pt`), Centroid Tracker.
- **Optimization & ML:** NumPy, SciPy, Scikit-Learn (RandomForestClassifier, RandomForestRegressor).
- **Simulation:** Custom Python Kinematic Engine (IDM), Eclipse SUMO / TraCI Bridge.

---

## 8. API Specification (Core Endpoints)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API health check and version metadata |
| `POST` | `/api/detection/upload` | Upload video file for vehicle detection |
| `GET` | `/api/detection/results/{id}` | Retrieve processed detection data and bounding boxes |
| `POST` | `/api/signals/optimize` | Compute Webster optimal signal split from density input |
| `GET` | `/api/simulation/state` | Get real-time 4-way intersection state and vehicle positions |
| `POST` | `/api/simulation/start` | Start simulation engine |
| `POST` | `/api/simulation/pause` | Pause simulation engine |
| `POST` | `/api/simulation/reset` | Reset simulation to initial state |
| `POST` | `/api/simulation/mode` | Switch mode (`adaptive` vs `fixed`) |
| `POST` | `/api/simulation/spawn` | Spawn vehicle (`direction`, `vtype`, `turn`) |
| `POST` | `/api/simulation/emergency` | Trigger emergency vehicle preemption |
| `GET` | `/api/simulation/corridor` | Get 3-junction corridor progression status |
| `POST` | `/api/prediction/predict` | Generate 6-hour forward congestion forecast |
| `GET` | `/api/prediction/metrics` | Retrieve ML model evaluation scores (MAE, $R^2$) |
| `GET` | `/api/analytics/benchmark` | Run comparative benchmark (Fixed vs Adaptive) |
| `WS` | `/ws/simulation` | WebSocket stream for 30 FPS telemetry updates |

---

## 9. Non-Functional Requirements (NFRs)

1. **Performance & Latency:**
   - Visual simulation maintains $\ge 60$ FPS on modern browser viewports.
   - Background physics ticker executes at $dt=0.3\text{s}$ ($3.33\text{Hz}$) without CPU throttling.
2. **Safety & Fail-Safe Mechanics:**
   - Under no circumstances can conflicting signal phases (NS and EW) display GREEN simultaneously.
   - If an unhandled exception occurs in the optimizer, the intersection falls back to a safe, default $30\text{s}$ fixed timer.
3. **Data Privacy & Local Execution:**
   - All uploaded videos and images are processed 100% locally on the host machine.
   - Zero external cloud API calls or telemetry leaks.
4. **Portability:**
   - One-click launch on Windows via `run_all.bat`.
   - Single command setup for macOS and Linux via standard shell scripts.

---

## 10. Verification & Automated Test Coverage

The platform includes an automated unit test suite (`tests/`):
- `tests/test_backend.py`: Validates API endpoints, detection fallback, Webster optimizer, emergency preemption, and ML predictors (8 tests).
- `tests/test_simulation_physics.py`: Validates physical vehicle bumper stop line adherence, IDM non-overlap gap maintenance, safe phase transitions (`GREEN` $\to$ `YELLOW` $\to$ `ALL-RED` $\to$ `GREEN`), intersection clearance guards, and turning movements (6 tests).

**Total Test Suite:** 14 automated unit tests, 100% passing.

---

## 11. Project Milestones & Future Roadmap

- [x] **Phase 1:** Core Architecture, Video Processing, and YOLO/OpenCV Detection Pipeline.
- [x] **Phase 2:** Webster Dynamic Signal Optimization with Starvation Prevention.
- [x] **Phase 3:** Virtual 4-Way Intersection with IDM Kinematics and Stop-Line Adherence.
- [x] **Phase 4:** Emergency Vehicle Preemption with Safe Yellow/All-Red Clearance.
- [x] **Phase 5:** Scikit-Learn Congestion Predictor and 6-Hour Forecasting.
- [x] **Phase 6:** Multi-Junction Arterial Corridor and SUMO Scenario Bridge.
- [x] **Phase 7:** UI Conversion to Clean White & Light Violet Theme with Real Google Maps.
- [ ] **Phase 8 (Post-Hackathon):** Connected Autonomous Vehicle (V2X / DSRC) communication simulation.
- [ ] **Phase 9 (Post-Hackathon):** Deep Reinforcement Learning (PPO / DQN) adaptive control comparisons.
