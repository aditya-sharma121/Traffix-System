import math
import random
import time
from typing import Dict, List, Any, Optional, Tuple
from backend.app.signal_optimizer.optimizer import AdaptiveSignalOptimizer
from backend.app.traffic_analysis.density_analyzer import DensityAnalyzer

# Physical vehicle dimensions in meters
VEHICLE_SPECS = {
    "motorcycle": {"length": 2.4, "width": 0.9, "max_speed": 13.0, "accel": 2.8, "decel": 5.0, "color": "#10B981"},
    "car":        {"length": 4.6, "width": 1.9, "max_speed": 12.0, "accel": 2.2, "decel": 4.5, "color": "#3B82F6"},
    "bus":        {"length": 11.5, "width": 2.5, "max_speed": 9.5, "accel": 1.6, "decel": 3.5, "color": "#F59E0B"},
    "truck":      {"length": 12.5, "width": 2.5, "max_speed": 9.0, "accel": 1.5, "decel": 3.5, "color": "#8B5CF6"},
    "emergency":  {"length": 5.8, "width": 2.2, "max_speed": 16.0, "accel": 3.5, "decel": 6.0, "color": "#EF4444"}
}


class VirtualVehicle:
    def __init__(self, vid: int, direction: str, vtype: str = "car", turn: str = "STRAIGHT", is_emergency: bool = False):
        self.id = vid
        self.direction = direction  # "NORTH", "SOUTH", "EAST", "WEST"
        self.type = vtype
        self.turn = turn  # "STRAIGHT", "LEFT", "RIGHT"
        self.is_emergency = is_emergency

        specs = VEHICLE_SPECS.get(vtype, VEHICLE_SPECS["car"])
        self.length = specs["length"]
        self.width = specs["width"]
        self.max_speed = specs["max_speed"]
        self.accel = specs["accel"]
        self.decel = specs["decel"]

        # Position along the path in meters (0 to 320m)
        # Approach start = 0m, Stop line = 180m, Center = 200m, Clearance end = 220m, Departure end = 320m
        self.position = 0.0
        self.speed = min(8.0, self.max_speed)
        self.waiting_time = 0.0
        self.has_cleared = False
        self.color = specs["color"] if not is_emergency else "#EF4444"

        # Additional car colors for cars to make them varied
        if vtype == "car" and not is_emergency:
            colors = ["#2563EB", "#0284C7", "#4F46E5", "#64748B", "#0D9488"]
            self.color = random.choice(colors)

    @property
    def front_position(self) -> float:
        """Position of the front bumper."""
        return self.position + (self.length / 2.0)

    @property
    def rear_position(self) -> float:
        """Position of the rear bumper."""
        return self.position - (self.length / 2.0)


class VirtualIntersection:
    def __init__(self, junction_id: str = "J1"):
        self.junction_id = junction_id

        # Geometry
        self.stop_line = 180.0
        self.junction_box_start = 178.0
        self.junction_box_end = 222.0
        self.road_length = 320.0

        self.vehicles: Dict[str, List[VirtualVehicle]] = {
            "NORTH": [],
            "SOUTH": [],
            "EAST": [],
            "WEST": []
        }
        self.next_vid = 1

        self.optimizer = AdaptiveSignalOptimizer()
        self.analyzer = DensityAnalyzer()

        # Signal state machine:
        # Standard: NS_GREEN -> NS_YELLOW -> ALL_RED_TO_EW -> EW_GREEN -> EW_YELLOW -> ALL_RED_TO_NS -> NS_GREEN
        # Emergency Safe Transitions: PRE_EMERGENCY_YELLOW -> PRE_EMERGENCY_ALL_RED -> EMERGENCY_GREEN -> POST_EMERGENCY_CLEARANCE
        self.phase = "NS_GREEN"
        self.current_allocated_green = 25
        self.yellow_time = 4.0
        self.all_red_time = 3.0
        self.time_remaining = 25.0

        # Emergency handling
        self.emergency_target_dir: Optional[str] = None
        self.emergency_pending_dir: Optional[str] = None
        self.emergency_phase_step: Optional[str] = None

        # Statistics
        self.total_spawned = 0
        self.total_cleared = 0
        self.total_wait_time = 0.0
        self.active_simulation = False
        self.sim_elapsed_time = 0.0
        self.spawn_rates = {"NORTH": 0.35, "SOUTH": 0.35, "EAST": 0.25, "WEST": 0.20}
        self.mode = "adaptive"  # "adaptive" or "fixed"

        # Latest AI optimizer explanation
        self.last_optimizer_decision: Optional[Dict[str, Any]] = None

    def set_mode(self, mode: str):
        if mode in ["adaptive", "fixed"]:
            self.mode = mode

    def reset(self):
        self.vehicles = {"NORTH": [], "SOUTH": [], "EAST": [], "WEST": []}
        self.next_vid = 1
        self.phase = "NS_GREEN"
        self.time_remaining = 25.0
        self.current_allocated_green = 25
        self.emergency_target_dir = None
        self.emergency_pending_dir = None
        self.emergency_phase_step = None
        self.total_spawned = 0
        self.total_cleared = 0
        self.total_wait_time = 0.0
        self.sim_elapsed_time = 0.0
        self.active_simulation = False
        self.last_optimizer_decision = None

    def trigger_emergency(self, direction: str = "NORTH"):
        """
        Safely preempts the intersection for an incoming emergency vehicle:
        Follows safe transition: if conflicting direction has green, transitions through Yellow -> All-Red first!
        """
        direction = direction.upper()
        if direction not in ["NORTH", "SOUTH", "EAST", "WEST"]:
            direction = "NORTH"

        # Spawn emergency vehicle in approach
        self.spawn_vehicle(direction, vtype="emergency", is_emergency=True, turn="STRAIGHT")

        # Determine current active green directions
        current_green_dirs = []
        if self.phase in ["NS_GREEN", "NS_YELLOW"]:
            current_green_dirs = ["NORTH", "SOUTH"]
        elif self.phase in ["EW_GREEN", "EW_YELLOW"]:
            current_green_dirs = ["EAST", "WEST"]

        if direction in current_green_dirs and self.phase in ["NS_GREEN", "EW_GREEN"]:
            # Same direction already has green, safely extend it
            self.emergency_target_dir = direction
            self.phase = f"EMERGENCY_{direction}"
            self.time_remaining = 25.0
        else:
            # Conflicting direction currently has Green or Yellow:
            # We MUST execute safe clearance (Yellow -> All-Red) before opening Emergency Green!
            self.emergency_pending_dir = direction
            if self.phase in ["NS_GREEN", "EW_GREEN"]:
                self.phase = "NS_YELLOW" if self.phase == "NS_GREEN" else "EW_YELLOW"
                self.time_remaining = 3.0  # Safe quick yellow
            elif self.phase not in ["NS_YELLOW", "EW_YELLOW", "ALL_RED_TO_EW", "ALL_RED_TO_NS"]:
                self.phase = "ALL_RED_TO_EW"
                self.time_remaining = 2.5

    def clear_emergency(self):
        self.emergency_target_dir = None
        self.emergency_pending_dir = None
        self.emergency_phase_step = None
        self.phase = "ALL_RED_TO_NS"
        self.time_remaining = self.all_red_time

    def spawn_vehicle(self, direction: str, vtype: Optional[str] = None, is_emergency: bool = False, turn: Optional[str] = None):
        if vtype is None:
            r = random.random()
            if r < 0.65:
                vtype = "car"
            elif r < 0.80:
                vtype = "motorcycle"
            elif r < 0.92:
                vtype = "bus"
            else:
                vtype = "truck"

        if turn is None:
            if is_emergency:
                turn = "STRAIGHT"
            else:
                tr = random.random()
                if tr < 0.65:
                    turn = "STRAIGHT"
                elif tr < 0.85:
                    turn = "RIGHT"
                else:
                    turn = "LEFT"

        specs = VEHICLE_SPECS.get(vtype, VEHICLE_SPECS["car"])
        veh_length = specs["length"]

        # Prevent spawn overlap: lane entrance must have clear buffer (at least length + 3.0m)
        lane = self.vehicles[direction]
        if lane:
            closest_rear = lane[-1].rear_position
            if closest_rear < (veh_length + 4.0):
                return  # Entrance is occupied, hold spawn for safe spacing

        veh = VirtualVehicle(self.next_vid, direction, vtype, turn=turn, is_emergency=is_emergency)
        self.next_vid += 1
        self.total_spawned += 1
        lane.append(veh)

    def get_signal_states(self) -> Dict[str, str]:
        """Returns exact GREEN, YELLOW, or RED for each of the 4 approaches."""
        if self.phase.startswith("EMERGENCY_"):
            em_dir = self.phase.split("_")[1]
            return {
                d: ("GREEN" if d == em_dir else "RED")
                for d in ["NORTH", "SOUTH", "EAST", "WEST"]
            }
        elif self.phase == "NS_GREEN":
            return {"NORTH": "GREEN", "SOUTH": "GREEN", "EAST": "RED", "WEST": "RED"}
        elif self.phase == "NS_YELLOW":
            return {"NORTH": "YELLOW", "SOUTH": "YELLOW", "EAST": "RED", "WEST": "RED"}
        elif self.phase in ["ALL_RED_TO_EW", "ALL_RED_TO_NS"]:
            return {"NORTH": "RED", "SOUTH": "RED", "EAST": "RED", "WEST": "RED"}
        elif self.phase == "EW_GREEN":
            return {"NORTH": "RED", "SOUTH": "RED", "EAST": "GREEN", "WEST": "GREEN"}
        elif self.phase == "EW_YELLOW":
            return {"NORTH": "RED", "SOUTH": "RED", "EAST": "YELLOW", "WEST": "YELLOW"}
        return {"NORTH": "RED", "SOUTH": "RED", "EAST": "RED", "WEST": "RED"}

    def _is_intersection_box_occupied(self) -> bool:
        """Checks if any vehicle is currently inside the active conflict zone (178m to 222m)."""
        for d, lane in self.vehicles.items():
            for v in lane:
                # If front has crossed stop line and rear hasn't fully cleared junction box
                if v.front_position > self.stop_line and v.rear_position < self.junction_box_end:
                    return True
        return False

    def _collect_current_density_input(self) -> Dict[str, Any]:
        """Gathers queue data from virtual approaches for the Webster optimizer."""
        vehicles_repr = []
        for d, vlist in self.vehicles.items():
            for v in vlist:
                if v.front_position < self.stop_line + 5.0:
                    vehicles_repr.append({
                        "direction": d,
                        "class_name": v.type,
                        "is_emergency": v.is_emergency
                    })
        return self.analyzer.analyze(vehicles_repr)

    def tick(self, dt: float = 0.3):
        """Simulates one physics & signal step with dt seconds."""
        self.sim_elapsed_time += dt

        # 1. Random Poisson vehicle arrivals
        for d, rate in self.spawn_rates.items():
            if random.random() < (rate * dt):
                self.spawn_vehicle(d)

        # 2. Advance signal state countdown & safe phase transitions
        self.time_remaining -= dt
        if self.time_remaining <= 0:
            self._transition_phase()

        signal_states = self.get_signal_states()

        # 3. Physics update: Intelligent Driver Model + Strict Stop Line Rule + Turning
        for direction, lane in self.vehicles.items():
            curr_signal = signal_states[direction]
            remaining_vehicles = []

            for i, veh in enumerate(lane):
                lead_vehicle = lane[i - 1] if i > 0 else None

                # Distance from vehicle's front bumper to the stop line
                dist_front_to_stop = self.stop_line - veh.front_position

                # Determine if vehicle must stop for signal
                # Vehicle must stop if:
                # - Signal is RED and vehicle has not crossed stop line yet (front_position <= stop_line)
                # - Signal is YELLOW and vehicle can stop safely without exceeding comfortable deceleration (4.5 m/s²)
                must_stop_for_signal = False
                if veh.front_position <= self.stop_line:
                    if curr_signal == "RED":
                        must_stop_for_signal = True
                    elif curr_signal == "YELLOW":
                        # If vehicle is too close to stop line at current speed, it's safer to clear
                        # stopping distance = v^2 / (2 * decel)
                        req_stop_dist = (veh.speed * veh.speed) / (2.0 * max(1.0, veh.decel))
                        if dist_front_to_stop > req_stop_dist + 2.0:
                            must_stop_for_signal = True

                # Desired target speed
                target_speed = veh.max_speed

                # Slow down if making a turn inside the junction
                if veh.turn in ["LEFT", "RIGHT"] and (self.stop_line - 5.0) < veh.position < self.junction_box_end:
                    target_speed = min(target_speed, 5.5)  # 20 km/h turning speed

                # Target acceleration via Intelligent Driver Model (IDM)
                # Free-flow acceleration
                v_ratio = veh.speed / max(0.1, target_speed)
                free_accel = veh.accel * (1.0 - (v_ratio ** 4))

                # Interaction with lead vehicle
                interaction_decel = 0.0
                s0 = 2.5  # minimum standstill bumper-to-bumper distance (meters)
                T = 1.2   # safe time headway (seconds)

                if lead_vehicle:
                    # Physical gap between lead rear bumper and this vehicle's front bumper
                    net_gap = lead_vehicle.rear_position - veh.front_position
                    delta_v = veh.speed - lead_vehicle.speed

                    # Desired gap
                    s_star = s0 + max(0.0, (veh.speed * T) + ((veh.speed * delta_v) / (2.0 * math.sqrt(max(0.1, veh.accel * veh.decel)))))
                    if net_gap > 0.1:
                        interaction_decel = veh.accel * ((s_star / net_gap) ** 2)
                    else:
                        # Collision prevention guard: if overlapping or extremely tight, force full stop
                        veh.speed = 0.0
                        interaction_decel = 999.0

                # Interaction with stop line on Red/Yellow
                # Strictly enforces: front bumper stops behind stop line (at least 1.5m buffer)
                if must_stop_for_signal and dist_front_to_stop > 0:
                    effective_stop_dist = max(0.1, dist_front_to_stop - 1.5)
                    s_star_stop = s0 + ((veh.speed * veh.speed) / (2.0 * veh.decel))
                    stop_line_decel = veh.accel * ((s_star_stop / effective_stop_dist) ** 2)
                    interaction_decel = max(interaction_decel, stop_line_decel)
                elif must_stop_for_signal and dist_front_to_stop <= 0.1:
                    # Vehicle is at the stop line: freeze speed
                    veh.speed = 0.0
                    interaction_decel = 999.0

                # Compute net acceleration
                net_accel = free_accel - interaction_decel
                # Clamp acceleration to vehicle capabilities
                net_accel = max(-veh.decel * 1.5, min(veh.accel, net_accel))

                # Update speed & position
                veh.speed = max(0.0, veh.speed + (net_accel * dt))
                veh.position += veh.speed * dt

                # Strict stop line position clamp:
                # If must stop for signal, front bumper MUST NEVER exceed stop_line - 0.5m!
                if must_stop_for_signal and veh.front_position > (self.stop_line - 0.5):
                    veh.position = (self.stop_line - 0.5) - (veh.length / 2.0)
                    veh.speed = 0.0

                # Track waiting time if vehicle is delayed / stopped (speed < 0.5 m/s before stop line)
                if veh.speed < 0.5 and veh.front_position <= self.stop_line + 2.0:
                    veh.waiting_time += dt
                    self.total_wait_time += dt

                # Check if cleared intersection (past departure boundary 320m)
                if veh.position >= self.road_length:
                    self.total_cleared += 1
                    if veh.is_emergency and direction == self.emergency_target_dir:
                        self.clear_emergency()
                else:
                    remaining_vehicles.append(veh)

            self.vehicles[direction] = remaining_vehicles

    def _transition_phase(self):
        """
        State machine handling safe transitions:
        GREEN -> YELLOW (4s) -> ALL_RED (3s + clearance guard) -> NEXT_GREEN.
        Guarantees that conflicting traffic NEVER gets green while any vehicle is inside the intersection box.
        """
        # If an emergency vehicle was pending safe clearance:
        if self.emergency_pending_dir:
            if self.phase in ["NS_YELLOW", "EW_YELLOW"]:
                self.phase = "ALL_RED_TO_EW"
                self.time_remaining = 2.5
                return
            elif self.phase in ["ALL_RED_TO_EW", "ALL_RED_TO_NS"]:
                # Check intersection clearance
                if self._is_intersection_box_occupied():
                    self.time_remaining = 1.0  # Hold All-Red until cleared
                    return
                # All clear! Open emergency green
                target = self.emergency_pending_dir
                self.emergency_pending_dir = None
                self.emergency_target_dir = target
                self.phase = f"EMERGENCY_{target}"
                self.time_remaining = 25.0
                return

        # Normal phase transitions:
        if self.phase.startswith("EMERGENCY_"):
            self.clear_emergency()
            return

        if self.phase == "NS_GREEN":
            # Transition to NS Yellow
            self.phase = "NS_YELLOW"
            self.time_remaining = self.yellow_time

        elif self.phase == "NS_YELLOW":
            # Transition to All-Red (Clearance Phase)
            self.phase = "ALL_RED_TO_EW"
            self.time_remaining = self.all_red_time

        elif self.phase == "ALL_RED_TO_EW":
            # CLEARANCE GUARD: Do not turn EW green if any vehicle is still inside the junction box!
            if self._is_intersection_box_occupied():
                self.time_remaining = 1.0  # Extend all-red clearance until junction is completely clear
                return

            self.phase = "EW_GREEN"
            self.time_remaining = self._calculate_next_green("EW")
            self.current_allocated_green = self.time_remaining

        elif self.phase == "EW_GREEN":
            # Transition to EW Yellow
            self.phase = "EW_YELLOW"
            self.time_remaining = self.yellow_time

        elif self.phase == "EW_YELLOW":
            # Transition to All-Red (Clearance Phase)
            self.phase = "ALL_RED_TO_NS"
            self.time_remaining = self.all_red_time

        elif self.phase == "ALL_RED_TO_NS":
            # CLEARANCE GUARD: Do not turn NS green if any vehicle is still inside the junction box!
            if self._is_intersection_box_occupied():
                self.time_remaining = 1.0  # Extend all-red clearance
                return

            self.phase = "NS_GREEN"
            self.time_remaining = self._calculate_next_green("NS")
            self.current_allocated_green = self.time_remaining

    def _calculate_next_green(self, phase_name: str) -> int:
        if self.mode == "fixed":
            return 30  # Fixed baseline: always 30s

        # Adaptive mode: query Webster optimizer
        density_data = self._collect_current_density_input()
        opt = self.optimizer.compute_optimal_schedule(density_data, emergency_override=self.emergency_target_dir)
        self.last_optimizer_decision = opt
        return opt["green_duration"]

    def get_state(self) -> Dict[str, Any]:
        """Serializes current intersection state for canvas rendering and WebSocket."""
        signals = self.get_signal_states()
        vehicles_data = []

        for d, vlist in self.vehicles.items():
            for v in vlist:
                vehicles_data.append({
                    "id": v.id,
                    "direction": d,
                    "type": v.type,
                    "turn": v.turn,
                    "position": round(v.position, 1),
                    "length": round(v.length, 1),
                    "width": round(v.width, 1),
                    "speed": round(v.speed, 1),
                    "is_emergency": v.is_emergency,
                    "color": v.color,
                    "waiting_time": round(v.waiting_time, 1)
                })

        # Calculate live queue lengths (stopped vehicles strictly behind stop line)
        queues = {}
        for d, vlist in self.vehicles.items():
            q_count = sum(1 for v in vlist if v.front_position <= self.stop_line and v.speed < 0.5)
            queues[d] = q_count

        avg_wait = round(self.total_wait_time / max(1, self.total_spawned), 1)
        vpm = round((self.total_cleared / max(0.5, self.sim_elapsed_time)) * 60.0, 1) if self.sim_elapsed_time > 0 else 0.0

        return {
            "junction_id": self.junction_id,
            "phase": self.phase,
            "mode": self.mode,
            "signals": signals,
            "time_remaining": max(0, int(round(self.time_remaining))),
            "allocated_green": self.current_allocated_green,
            "emergency_active": self.phase.startswith("EMERGENCY_") or self.emergency_target_dir is not None,
            "emergency_direction": self.emergency_target_dir or self.emergency_pending_dir,
            "intersection_cleared": not self._is_intersection_box_occupied(),
            "vehicles": vehicles_data,
            "vehicle_count": len(vehicles_data),
            "queues": queues,
            "total_spawned": self.total_spawned,
            "total_cleared": self.total_cleared,
            "avg_wait_time": avg_wait,
            "throughput_vpm": vpm,
            "last_decision": self.last_optimizer_decision
        }
