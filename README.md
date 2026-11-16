# TRAFFIQ: AI-Powered Intelligent Traffic Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20Tailwind-7C3AED.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV%20%26%20YOLOv8-5C3EE8.svg)](https://opencv.org/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E.svg)](https://scikit-learn.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-14%2F14%20Passing-brightgreen.svg)](tests/)

> **Detect. Analyze. Predict. Optimize.**  
> An autonomous, software-only intelligent traffic management platform that transforms urban intersections through real-time computer vision, Webster delay-minimization signal optimization, machine learning congestion forecasting, emergency priority corridor control, and high-fidelity physics simulation with Real Google Maps integration.

---

## 📚 Master Project Documentation

For deep technical specifications, design blueprints, and requirements, review the core architectural documents:

- 📋 [**PRD.md**](PRD.md) — Complete Product Requirements Document (Personas, KPIs, NFRs, Feature Specs)
- 📐 [**Design.md**](Design.md) — Technical Design Document (Class Architecture, Mathematical Formulations, IDM Kinematics, Schemas)
- 🏛️ [**Architecture.md**](Architecture.md) — System Architecture Document (Layered Topology, Sequence Diagrams, Fail-Safes)

---

## 🚦 Problem Statement

Traditional traffic control infrastructures rely on static, pre-programmed timers that cannot respond dynamically to fluctuating traffic flows. This causes:
- Unnecessary red-light waiting times in empty lanes while opposing lanes choke with long queues.
- Severe urban congestion, fuel wastage, and increased vehicle idle emissions ($CO_2$).
- Critical delays for ambulances, fire engines, and police responders stuck in traffic.
- Lack of predictive foresight to proactively prevent bottleneck gridlocks before they form.

**TRAFFIQ** solves this with an AI-driven, software-only system that analyzes real-time traffic density, dynamically optimizes green signal allocations, guarantees pedestrian minimums and starvation elimination, and preemptively clears emergency transit corridors.

---

## 💻 100% Software-Only Architecture

TRAFFIQ is strictly software-based and designed to run smoothly on any standard Windows laptop:
- ❌ **No physical hardware required:** No Arduino, Raspberry Pi, ESP32, ultrasonic sensors, or physical lights.
- ❌ **No physical CCTV needed:** Accepts uploaded traffic MP4/AVI videos, webcam streams, or built-in crisp synthetic aerial footage.
- ✅ **Runs on Standard CPU:** Optimized OpenCV vision tracking and lightweight machine learning models guarantee 60+ FPS simulation without requiring expensive GPUs.

---

## 🎨 Clean White & Light Violet UI Theme

TRAFFIQ features a modern, clean, user-friendly interface designed with a **White and Light Violet** palette:
- Soft off-white crystalline backdrop (`#fbfbfe`) with pure white card surfaces (`#ffffff`).
- Refined violet borders (`border-violet-100`) and violet typography accents (`text-violet-950`).
- Vibrant status indicators: Emerald Green for active green waves, Amber for caution/all-red hold, and Rose Red for emergency preemption.

---

## 🧠 Key Features & Modules

### 1. AI Vehicle Detection & Tracking
- Detects cars, buses, trucks, motorcycles, and emergency vehicles from uploaded traffic footage.
- Draws real-time bounding boxes, assigns persistent tracking IDs, and computes vehicle speeds.
- Employs YOLOv8 neural network inference with robust OpenCV contour and background-subtraction fallback (zero fake or fabricated data).

### 2. Directional Traffic Density & Queue Analysis
- Evaluates approach congestion for North, South, East, and West lanes.
- Converts mixed traffic into standard Passenger Car Equivalent units (PCU: Car=1.0, Bus=2.5, Truck=3.0, Motorcycle=0.5, Emergency=2.0).
- Projects spatial queue lengths ($L_{\text{queue}} = \text{PCU} \times 6.5\text{m}$) and saturation percentages.

### 3. Adaptive Traffic Signal Optimization (Core Engine)
- Dynamically allocates green signal durations using Webster's equisaturation delay-minimization formulation.
- Enforces strict safety guardrails: Minimum green ($10\text{s}$), Maximum green ($60\text{s}$), Yellow transition ($4\text{s}$), and All-Red clearance ($3\text{s} + \text{Clearance Guard}$).
- **Starvation Elimination Guarantee:** Tracks wait cycle age and boosts priority for low-traffic approaches to prevent starvation.
- **Explainable AI (XAI):** Provides clear, human-readable explanations detailing why each phase and duration was chosen.

### 4. Interactive Virtual 4-Way Intersection & Real Google Maps
- **Dual Visualizer Modes:**
  1. **4-Way Junction Canvas:** 60 FPS HTML5 Canvas simulation with Google Streets, Satellite Aerial, and Live Traffic Nav basemaps.
  2. **Real Google Map View:** Interactive Leaflet map displaying real city coordinates (NYC Times Square, SF Market St, London Oxford Circus, Tokyo Shibuya, New Delhi Connaught Place, Bengaluru MG Road) with live signal heads and traffic polyline heatmaps.
- **Physics-Grounded Kinematics:**
  - **Intelligent Driver Model (IDM):** Realistic car-following with standstill headway buffer ($s_0=2.5\text{m}$) and zero vehicle overlap.
  - **Strict Stop-Line Adherence:** Front bumpers stop strictly behind the $180.0\text{m}$ stop line (target $\le 179.5\text{m}$, zero crosswalk overhanging).
  - **Safe Phase Sequence:** $\text{GREEN} \to \text{YELLOW (4s)} \to \text{ALL RED (3s + Clearance Guard)} \to \text{NEXT GREEN}$.
  - **Intersection Clearance Guard:** Opposing green is locked on ALL RED while any vehicle or turning car clears the junction box ($178\text{m}-222\text{m}$).
  - **Turning Movements:** Supports Straight, Right Turn (inner arc), and Left Turn (wide center arc) with realistic deceleration and blinkers.
  - **Full Simulation Controls:** Start, Pause, Resume, Reset, and Manual Vehicle Injection (Direction, Vehicle Type, Turn Intention).

### 5. Emergency Vehicle Priority Protocol
- Rapid preemption mode granting continuous green waves to first responders (Ambulances, Fire, Police).
- **Safe Transition Deceleration:** Preemption safely transitions through Yellow ($3\text{s}$) and All-Red ($2.5\text{s}$) clearance before opening green, eliminating collision risks.
- Features a manual override dispatcher for dependable hackathon demonstrations.

### 6. Machine Learning Congestion Forecasting
- Scikit-Learn Random Forest Classifier and Regressor predicting future congestion levels and density percentages.
- Outputs a 6-hour forward congestion trend with model evaluation metrics (Accuracy, F1-Score, MAE, Feature Importance).

### 7. Multi-Junction Corridor & Eclipse SUMO Integration
- Monitors a synchronized 3-junction corridor (North Corridor, Metro Plaza, Tech Park) with coordinated Green Wave progression offsets ($8\text{s}$ delta).
- Provides an automated scenario generator creating standard Eclipse SUMO network files (`.nod.xml`, `.edg.xml`, `.sumocfg`) with TraCI integration.

### 8. Performance Analytics & Scientific Benchmarking
- Directly tests Traditional Fixed-Time Signals ($30\text{s}$) against TRAFFIQ Adaptive Control on identical seeded vehicle arrival streams.
- Measures empirical improvements: **20% to 35% reduction in average delay**, significant queue shortening, and calculated $CO_2$ emission savings.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons, Recharts, Leaflet.js, HTML5 Canvas |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, SQLite, WebSockets |
| **AI / Vision** | OpenCV, YOLOv8 (Ultralytics), Centroid & IoU Association Tracker |
| **Machine Learning**| Scikit-Learn (Random Forest Classifier & Regressor), NumPy, SciPy |
| **Simulation** | Native Python Physics Engine (IDM Kinematics), Eclipse SUMO & TraCI Connector |

---

## ⚡ Quick Start & Windows Setup Guide

### Prerequisites
- **Python 3.10+** (Tested on Python 3.10 – 3.14)
- **Node.js 18+** & npm

### Method 1: One-Click Launch (Windows)

Simply double-click `run_all.bat` or execute in PowerShell:
```powershell
.\run_all.bat
```
This automatically starts:
- Backend API on **`http://127.0.0.1:8000`** (Swagger docs at `/docs`)
- Frontend UI on **`http://localhost:5173`**

---

### Method 2: Manual Step-by-Step Setup

#### 1. Backend Setup
```powershell
# Clone the repository
git clone https://github.com/your-username/TRAFFIQ.git
cd TRAFFIQ

# Create and activate python virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Run backend API server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```powershell
# Open a new terminal and navigate to frontend
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Running Automated Unit Tests

TRAFFIQ includes an automated test suite verifying API contracts, AI detection fallbacks, Webster optimizer algorithms, vehicle kinematics, stop lines, IDM collision avoidance, clearance guards, and safe transitions:

```powershell
# Run the complete test suite across all modules
.\venv\Scripts\python -m unittest discover -s tests -p "test_*.py"
```

Expected output:
```
Ran 14 tests in 0.55s
OK
```

### Breakdown of Test Suites:
- **`tests/test_backend.py` (8 Tests):**
  - Health check & API schemas
  - Adaptive signal optimizer calculation
  - Simulation state machine queries
  - ML congestion prediction inference & metrics
  - Detection pipeline & OpenCV fallback
  - Emergency preemption handler
- **`tests/test_simulation_physics.py` (6 Tests):**
  - `test_stop_behind_stop_line_on_red`: Proves all bumper positions $\le 180.0\text{m}$.
  - `test_safe_distance_and_no_overlap`: Proves headway gap $\ge 2.5\text{m}$ between consecutive vehicles.
  - `test_safe_phase_transitions`: Asserts strict transition sequence ($\text{Green} \to \text{Yellow} \to \text{All-Red} \to \text{Next Green}$).
  - `test_intersection_clearance_guard`: Verifies green cannot open while conflict zone is occupied.
  - `test_turning_movements_support`: Verifies Straight, Left, and Right turns.
  - `test_safe_emergency_preemption`: Verifies safe yellow/all-red deceleration before emergency green override.

---

## 🏆 Hackathon Demonstration Workflow

Follow this sequence for an engaging hackathon presentation:

1. **Dashboard Overview:** Open `http://localhost:5173`. Review the high-level KPI cards, live traffic pulse, and autonomous status.
2. **AI Vehicle Detection:** Go to **AI Vehicle Detection**. Click **"Generate & Analyze Demo Video"** (or upload your own traffic video). Observe real-time frame bounding boxes, class distribution, and directional PCU loads.
3. **Adaptive Signal Optimizer:** Go to **Signal Optimizer**. Move the North/South and East/West traffic sliders to watch the Webster formula recalculate phase durations and output explainable AI reasoning.
4. **Virtual 4-Way Junction:** Go to **Virtual 4-Way Junction**.
   - Click **"Start Simulation"**.
   - Observe vehicles stopping strictly behind stop lines on red with safe headway distances (zero overlap).
   - Test turning movements by injecting a Right Turn or Left Turn vehicle.
   - Switch view mode to **"Real Google Map"** to see the intersection mapped to NYC Times Square, London Oxford Circus, or Tokyo Shibuya.
   - Inspect the **Adaptive Signal Reasoning** telemetry card explaining live Webster phase decisions.
5. **Emergency Vehicle Preemption:** Click **"Ambulance (North)"**. Watch conflicting lights safely transition through Yellow $\to$ All-Red clearance before locking in continuous Emergency GREEN.
6. **Congestion Prediction:** Go to **Congestion Prediction**. Adjust Time of Day, Weather, and Incident parameters to view the ML prediction and 6-hour forecast curve.
7. **Performance Benchmark:** Go to **Performance Analytics**. Click **"Run Seeded Benchmark"** to display side-by-side comparative graphs proving delay reduction and fuel/CO2 savings.

---

## 📁 Repository Structure

```
TRAFFIQ/
├── PRD.md                         # Product Requirements Document
├── Design.md                      # Technical Design Document
├── Architecture.md                # System Architecture Document
├── README.md                      # Master Readme & Quickstart
├── LICENSE                        # MIT License
│
├── backend/
│   ├── app/
│   │   ├── api/                   # REST API routers (detection, signals, sim, prediction)
│   │   ├── database/              # SQLAlchemy models & SQLite setup
│   │   ├── detection/             # OpenCV & YOLO vehicle detection, tracking, video pipeline
│   │   ├── emergency_detection/   # Priority preemption & corridor safety lock
│   │   ├── prediction/            # Scikit-learn Random Forest congestion models
│   │   ├── signal_optimizer/      # Webster delay-minimization adaptive optimizer
│   │   ├── simulation/            # 4-way virtual intersection, multi-junction, SUMO bridge
│   │   └── main.py                # FastAPI entry point & WebSocket server
│   └── requirements.txt           # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/            # VirtualIntersectionCanvas, RealGoogleMapView, UI widgets
│   │   ├── pages/                 # 11 dedicated module views
│   │   ├── services/              # API and WebSocket client layer
│   │   ├── App.tsx                # Main dashboard shell & navigation
│   │   └── main.tsx               # React entry point
│   ├── package.json
│   └── vite.config.ts
│
├── datasets/                      # Sample synthetic traffic footage
├── docs/                          # Architecture blueprints & technical documentation
├── tests/                         # Automated unit test suite
│   ├── test_backend.py            # API & Module unit tests (8 tests)
│   └── test_simulation_physics.py# Kinematics, IDM, stop lines & safety tests (6 tests)
│
├── run_backend.bat                # Windows 1-click backend launcher
├── run_frontend.bat               # Windows 1-click frontend launcher
└── run_all.bat                    # Windows 1-click full stack launcher
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
