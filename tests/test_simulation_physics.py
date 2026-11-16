import unittest
from backend.app.simulation.virtual_intersection import VirtualIntersection, VEHICLE_SPECS


class TestSimulationPhysicsAndTransitions(unittest.TestCase):
    def setUp(self):
        self.sim = VirtualIntersection(junction_id="TestJunction")
        self.sim.active_simulation = True

    def test_stop_behind_stop_line_on_red(self):
        """Vehicles must stop strictly behind the stop line (front bumper <= 180.0m) on RED."""
        # Set EW to RED and spawn multiple vehicles in East and West
        self.sim.phase = "NS_GREEN"
        self.sim.signals = {"NORTH": "GREEN", "SOUTH": "GREEN", "EAST": "RED", "WEST": "RED"}

        # Spawn 5 cars in EAST
        for _ in range(5):
            self.sim.spawn_vehicle("EAST", vtype="car", turn="STRAIGHT")
            # Advance slightly between spawns to let them enter safely
            for _ in range(10):
                self.sim.tick(0.2)

        # Run for 20 seconds while EAST is held at RED
        for _ in range(100):
            self.sim.tick(0.2)
            # Check all queued vehicles in EAST
            for veh in self.sim.vehicles["EAST"]:
                if veh.position <= self.sim.stop_line:
                    self.assertLessEqual(
                        veh.front_position, 
                        self.sim.stop_line + 0.05, 
                        f"Vehicle {veh.id} front bumper {veh.front_position:.2f} exceeded stop line {self.sim.stop_line} on RED!"
                    )

    def test_safe_distance_and_no_overlap(self):
        """Vehicles in the same lane must never physically overlap."""
        self.sim.phase = "NS_GREEN"
        # Spawn mixed vehicles in NORTH approach
        vtypes = ["car", "bus", "truck", "motorcycle", "car"]
        for vt in vtypes:
            self.sim.spawn_vehicle("NORTH", vtype=vt, turn="STRAIGHT")
            for _ in range(8):
                self.sim.tick(0.2)

        # Run simulation through green, yellow, and red cycles
        for step in range(300):
            self.sim.tick(0.2)
            for d, lane in self.sim.vehicles.items():
                for i in range(len(lane) - 1):
                    lead = lane[i]
                    follower = lane[i + 1]
                    # Lead is ahead of follower
                    if lead.position > follower.position:
                        # Physical gap between lead rear bumper and follower front bumper
                        bumper_gap = lead.rear_position - follower.front_position
                        self.assertGreaterEqual(
                            bumper_gap, 
                            -0.1,  # allow infinitesimal float epsilon
                            f"Step {step} Lane {d}: Overlap detected! Lead {lead.type} rear {lead.rear_position:.2f}m vs Follower {follower.type} front {follower.front_position:.2f}m (gap={bumper_gap:.2f}m)"
                        )

    def test_safe_phase_transitions(self):
        """Signal transitions must strictly follow GREEN -> YELLOW -> ALL RED -> NEXT GREEN."""
        observed_phases = []
        last_phase = self.sim.phase
        observed_phases.append(last_phase)

        for _ in range(800):
            self.sim.tick(0.2)
            if self.sim.phase != last_phase:
                observed_phases.append(self.sim.phase)
                last_phase = self.sim.phase

        # Verify that an NS_GREEN never transitions directly to EW_GREEN
        for i in range(len(observed_phases) - 1):
            curr_p = observed_phases[i]
            next_p = observed_phases[i + 1]
            if curr_p == "NS_GREEN":
                self.assertEqual(next_p, "NS_YELLOW", f"NS_GREEN must transition to NS_YELLOW, got {next_p}")
            elif curr_p == "NS_YELLOW":
                self.assertEqual(next_p, "ALL_RED_TO_EW", f"NS_YELLOW must transition to ALL_RED_TO_EW, got {next_p}")
            elif curr_p == "EW_GREEN":
                self.assertEqual(next_p, "EW_YELLOW", f"EW_GREEN must transition to EW_YELLOW, got {next_p}")
            elif curr_p == "EW_YELLOW":
                self.assertEqual(next_p, "ALL_RED_TO_NS", f"EW_YELLOW must transition to ALL_RED_TO_NS, got {next_p}")

    def test_intersection_clearance_guard(self):
        """Conflicting green must not open while a vehicle is inside the intersection box."""
        # Put sim in ALL_RED_TO_EW
        self.sim.phase = "ALL_RED_TO_EW"
        self.sim.time_remaining = 0.1  # about to expire

        # Place a vehicle right in the middle of the intersection box (pos = 200m)
        self.sim.spawn_vehicle("NORTH", vtype="bus", turn="STRAIGHT")
        test_bus = self.sim.vehicles["NORTH"][-1]
        test_bus.position = 200.0  # inside junction box (178m - 222m)
        test_bus.speed = 4.0

        # Tick simulation: clearance guard should hold all-red
        self.sim.tick(0.2)
        self.assertEqual(self.sim.phase, "ALL_RED_TO_EW", "Clearance guard must hold ALL_RED while vehicle is inside box!")
        self.assertFalse(self.sim.get_state()["intersection_cleared"])

    def test_turning_movements_support(self):
        """Vehicles with STRAIGHT, LEFT, and RIGHT turns operate correctly."""
        self.sim.spawn_vehicle("NORTH", vtype="car", turn="STRAIGHT")
        self.sim.spawn_vehicle("SOUTH", vtype="car", turn="RIGHT")
        self.sim.spawn_vehicle("EAST", vtype="car", turn="LEFT")

        turns = [v.turn for lane in self.sim.vehicles.values() for v in lane]
        self.assertIn("STRAIGHT", turns)
        self.assertIn("RIGHT", turns)
        self.assertIn("LEFT", turns)

    def test_safe_emergency_preemption(self):
        """Emergency preemption must safely transition via Yellow and All-Red before granting green."""
        # NS has green, trigger emergency on WEST
        self.sim.phase = "NS_GREEN"
        self.sim.time_remaining = 20.0
        self.sim.trigger_emergency("WEST")

        # Must transition to yellow to safely slow down moving NS traffic, not an instant cut
        self.assertEqual(self.sim.phase, "NS_YELLOW")
        # Tick past yellow (3.0s)
        for _ in range(20):
            self.sim.tick(0.2)

        # Must transition to ALL_RED_TO_EW for intersection clearance
        self.assertEqual(self.sim.phase, "ALL_RED_TO_EW")

        # Tick past all-red (2.5s)
        for _ in range(20):
            self.sim.tick(0.2)

        # Now emergency direction safely gets green
        self.assertEqual(self.sim.phase, "EMERGENCY_WEST")
        signals = self.sim.get_signal_states()
        self.assertEqual(signals["WEST"], "GREEN")
        self.assertEqual(signals["NORTH"], "RED")
        self.assertEqual(signals["EAST"], "RED")


if __name__ == "__main__":
    unittest.main()
