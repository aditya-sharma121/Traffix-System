import math
from typing import Dict, List, Tuple


class TrackedVehicle:
    def __init__(self, track_id: int, bbox: Tuple[int, int, int, int], class_name: str, confidence: float):
        self.track_id = track_id
        self.bbox = bbox  # x1, y1, x2, y2
        self.class_name = class_name
        self.confidence = confidence
        self.centroid = self._calc_centroid(bbox)
        self.history = [self.centroid]
        self.disappeared_frames = 0
        self.direction = "UNKNOWN"
        self.speed_px_per_frame = 0.0

    @staticmethod
    def _calc_centroid(bbox: Tuple[int, int, int, int]) -> Tuple[int, int]:
        x1, y1, x2, y2 = bbox
        return (int((x1 + x2) / 2), int((y1 + y2) / 2))

    def update(self, bbox: Tuple[int, int, int, int], confidence: float):
        self.bbox = bbox
        self.confidence = confidence
        new_centroid = self._calc_centroid(bbox)
        
        # Calculate speed estimate
        if len(self.history) > 0:
            dx = new_centroid[0] - self.history[-1][0]
            dy = new_centroid[1] - self.history[-1][1]
            self.speed_px_per_frame = math.hypot(dx, dy)
            
        self.history.append(new_centroid)
        if len(self.history) > 30:
            self.history.pop(0)
        self.centroid = new_centroid
        self.disappeared_frames = 0


class VehicleTracker:
    def __init__(self, max_disappeared: int = 15, max_distance: float = 60.0):
        self.next_id = 1
        self.tracks: Dict[int, TrackedVehicle] = {}
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance

    def update(self, detections: List[dict]) -> List[TrackedVehicle]:
        """
        detections: list of dicts with keys: 'bbox': (x1, y1, x2, y2), 'class_name': str, 'confidence': float
        """
        if len(detections) == 0:
            for track_id in list(self.tracks.keys()):
                self.tracks[track_id].disappeared_frames += 1
                if self.tracks[track_id].disappeared_frames > self.max_disappeared:
                    del self.tracks[track_id]
            return list(self.tracks.values())

        input_centroids = [
            (int((d['bbox'][0] + d['bbox'][2]) / 2), int((d['bbox'][1] + d['bbox'][3]) / 2))
            for d in detections
        ]

        if len(self.tracks) == 0:
            for i, det in enumerate(detections):
                self.register(det)
        else:
            track_ids = list(self.tracks.keys())
            track_centroids = [self.tracks[tid].centroid for tid in track_ids]

            # Match detections to existing tracks by minimum Euclidean distance
            used_tracks = set()
            used_detections = set()

            # Pairwise distances
            distances = []
            for t_idx, t_c in enumerate(track_centroids):
                for d_idx, d_c in enumerate(input_centroids):
                    dist = math.hypot(t_c[0] - d_c[0], t_c[1] - d_c[1])
                    distances.append((dist, t_idx, d_idx))

            distances.sort(key=lambda x: x[0])

            for dist, t_idx, d_idx in distances:
                if t_idx in used_tracks or d_idx in used_detections:
                    continue
                if dist > self.max_distance:
                    continue

                track_id = track_ids[t_idx]
                det = detections[d_idx]
                self.tracks[track_id].update(det['bbox'], det['confidence'])
                used_tracks.add(t_idx)
                used_detections.add(d_idx)

            # Unmatched existing tracks
            for t_idx, track_id in enumerate(track_ids):
                if t_idx not in used_tracks:
                    self.tracks[track_id].disappeared_frames += 1
                    if self.tracks[track_id].disappeared_frames > self.max_disappeared:
                        del self.tracks[track_id]

            # Unmatched detections are new vehicles
            for d_idx, det in enumerate(detections):
                if d_idx not in used_detections:
                    self.register(det)

        return list(self.tracks.values())

    def register(self, detection: dict):
        track = TrackedVehicle(
            track_id=self.next_id,
            bbox=detection['bbox'],
            class_name=detection['class_name'],
            confidence=detection['confidence']
        )
        self.tracks[self.next_id] = track
        self.next_id += 1
