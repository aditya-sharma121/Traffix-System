import os
import cv2
import time
import logging
import numpy as np
from typing import Dict, Any, List, Optional
from backend.app.detection.detector import VehicleDetector
from backend.app.detection.tracker import VehicleTracker
from backend.app.traffic_analysis.density_analyzer import DensityAnalyzer
from backend.app.signal_optimizer.optimizer import AdaptiveSignalOptimizer

logger = logging.getLogger(__name__)


class VideoProcessor:
    def __init__(self):
        self.detector = VehicleDetector()
        self.tracker = VehicleTracker()
        self.density_analyzer = DensityAnalyzer()
        self.optimizer = AdaptiveSignalOptimizer()

        self.is_processing = False
        self.progress_percent = 0
        self.current_frame_data: Dict[str, Any] = {}
        self.last_results: Dict[str, Any] = {}

    def process_video_file(
        self,
        video_path: str,
        frame_skip: int = 2,
        max_frames: int = 150
    ) -> Dict[str, Any]:
        """
        Processes a video file with frame skipping for smooth laptop CPU execution.
        Extracts detections, tracks vehicles, calculates density, and computes optimal signal timings.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        total_file_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480

        self.is_processing = True
        self.progress_percent = 0

        frame_idx = 0
        processed_count = 0
        all_detections_history = []
        class_counts = {"car": 0, "bus": 0, "truck": 0, "motorcycle": 0, "emergency": 0}
        direction_counts = {"NORTH": 0, "SOUTH": 0, "EAST": 0, "WEST": 0}

        start_time = time.time()
        last_density_analysis = {}

        try:
            while cap.isOpened() and processed_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_idx += 1
                if frame_idx % frame_skip != 0:
                    continue

                processed_count += 1
                self.progress_percent = int(min(98, (processed_count / min(max_frames, total_file_frames / frame_skip)) * 100))

                # Resize for fast CPU inference if larger than 720p
                if width > 1280:
                    frame = cv2.resize(frame, (1280, int(height * (1280 / width))))
                    fw, fh = 1280, int(height * (1280 / width))
                else:
                    fw, fh = width, height

                # Run detector
                detections, model_used = self.detector.detect_frame(frame)

                # Run tracker
                active_tracks = self.tracker.update(detections)

                # Format frame vehicle output
                frame_vehicles = []
                for t in active_tracks:
                    d_assigned = self.density_analyzer.assign_direction_by_position(t.bbox, fw, fh)
                    t.direction = d_assigned
                    direction_counts[d_assigned] += 1
                    class_counts[t.class_name] = class_counts.get(t.class_name, 0) + 1

                    frame_vehicles.append({
                        "id": t.track_id,
                        "bbox": list(t.bbox),
                        "class_name": t.class_name,
                        "confidence": t.confidence,
                        "direction": d_assigned,
                        "is_emergency": t.class_name == "emergency"
                    })

                # Calculate density for this frame
                last_density_analysis = self.density_analyzer.analyze(frame_vehicles, fw, fh)

                all_detections_history.append({
                    "frame": frame_idx,
                    "vehicles": frame_vehicles,
                    "count": len(frame_vehicles),
                    "density": last_density_analysis["overall_density_percent"]
                })

        finally:
            cap.release()
            self.is_processing = False
            self.progress_percent = 100

        elapsed = round(time.time() - start_time, 2)
        processing_fps = round(processed_count / max(0.1, elapsed), 1)

        # Compute optimal signal plan based on aggregated video density
        signal_plan = self.optimizer.compute_optimal_schedule(last_density_analysis)

        results = {
            "video_filename": os.path.basename(video_path),
            "total_frames_in_file": total_file_frames,
            "processed_frames": processed_count,
            "processing_time_sec": elapsed,
            "processing_fps": processing_fps,
            "model_engine": self.detector.model_type,
            "total_unique_vehicles_tracked": self.tracker.next_id - 1,
            "class_distribution": class_counts,
            "direction_distribution": direction_counts,
            "latest_density_analysis": last_density_analysis,
            "optimized_signal_schedule": signal_plan,
            "sample_frames_history": all_detections_history[-15:],
            "system_note": "Video analyzed using actual frame-by-frame computer vision and dynamic Webster optimization."
        }
        self.last_results = results
        return results

    @staticmethod
    def generate_synthetic_traffic_video(output_path: str = "./datasets/sample_traffic.mp4", duration_sec: int = 8) -> str:
        """
        Creates a crisp 4-way aerial intersection video with synthetic moving vehicles
        so users can immediately test video upload and detection with 0 external downloads!
        """
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        w, h = 640, 480
        fps = 20
        total_frames = duration_sec * fps

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))

        # Vehicle simulation states for drawing
        cars = [
            # [x, y, dx, dy, color, w, h, label]
            [w//2 - 25, 20, 0, 4, (50, 150, 240), 20, 35, "car"],      # Southbound
            [w//2 - 25, 140, 0, 3, (180, 80, 50), 22, 40, "car"],
            [w//2 + 10, h - 40, 0, -4, (80, 200, 80), 20, 35, "car"],  # Northbound
            [w//2 + 10, h - 160, 0, -3, (50, 50, 220), 25, 55, "bus"],
            [30, h//2 + 10, 4, 0, (200, 160, 40), 35, 20, "car"],     # Eastbound
            [160, h//2 + 10, 3, 0, (220, 220, 220), 30, 18, "car"],
            [w - 40, h//2 - 25, -4, 0, (40, 220, 240), 35, 20, "car"], # Westbound
            [w - 180, h//2 - 25, -3, 0, (0, 0, 255), 38, 22, "emergency"] # Ambulance
        ]

        for f in range(total_frames):
            frame = np.full((h, w, 3), (35, 38, 42), dtype=np.uint8)  # dark road background

            # Draw 4-way asphalt intersection
            road_w = 90
            cv2.rectangle(frame, (w//2 - road_w//2, 0), (w//2 + road_w//2, h), (55, 60, 68), -1)
            cv2.rectangle(frame, (0, h//2 - road_w//2), (w, h//2 + road_w//2), (55, 60, 68), -1)

            # Draw lane dividers (dashed yellow center lines)
            for y in range(0, h, 25):
                if abs(y - h//2) > road_w//2:
                    cv2.line(frame, (w//2, y), (w//2, y + 12), (0, 215, 255), 2)
            for x in range(0, w, 25):
                if abs(x - w//2) > road_w//2:
                    cv2.line(frame, (x, h//2), (x + 12, h//2), (0, 215, 255), 2)

            # Draw moving vehicles
            for c in cars:
                c[0] += c[2]
                c[1] += c[3]

                # Loop boundary
                if c[1] > h + 50: c[1] = -40
                if c[1] < -50: c[1] = h + 40
                if c[0] > w + 50: c[0] = -40
                if c[0] < -50: c[0] = w + 40

                x, y, cw, ch = int(c[0]), int(c[1]), c[5], c[6]
                cv2.rectangle(frame, (x, y), (x + cw, y + ch), c[4], -1)
                cv2.rectangle(frame, (x, y), (x + cw, y + ch), (255, 255, 255), 1)

                # If emergency, draw flashing beacon
                if c[7] == "emergency":
                    beacon_color = (0, 0, 255) if (f // 3) % 2 == 0 else (255, 0, 0)
                    cv2.circle(frame, (x + cw//2, y + ch//2), 5, beacon_color, -1)

            out.write(frame)

        out.release()
        return output_path
