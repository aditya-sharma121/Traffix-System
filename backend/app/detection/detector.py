import cv2
import numpy as np
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# COCO vehicle class mappings
VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}

class VehicleDetector:
    def __init__(self, confidence_threshold: float = 0.35):
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.model_type = "opencv_contour_cv"
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=25, detectShadows=True)
        self._init_model()

    def _init_model(self):
        # Attempt to load Ultralytics YOLO if present
        try:
            from ultralytics import YOLO
            self.model = YOLO("yolov8n.pt")
            self.model_type = "yolov8n"
            logger.info("Loaded YOLOv8n detector successfully.")
        except Exception as e:
            logger.info(f"Ultralytics YOLO not active ({e}). Using OpenCV Adaptive Vision Detector.")
            self.model = None
            self.model_type = "opencv_contour_cv"

    def detect_frame(self, frame: np.ndarray) -> Tuple[List[Dict[str, Any]], str]:
        """
        Detects vehicles in a given BGR frame.
        Returns:
            list of dicts: [
               {"bbox": (x1, y1, x2, y2), "class_name": "car", "confidence": 0.85, "is_emergency": False}
            ]
            model_type used.
        """
        h, w = frame.shape[:2]
        detections = []

        if self.model_type.startswith("yolo") and self.model is not None:
            try:
                results = self.model(frame, verbose=False, conf=self.confidence_threshold)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0].item())
                        conf = float(box.conf[0].item())
                        if cls_id in VEHICLE_CLASSES:
                            xyxy = box.xyxy[0].tolist()
                            x1, y1, x2, y2 = [int(v) for v in xyxy]
                            class_name = VEHICLE_CLASSES[cls_id]

                            # Check for emergency vehicle characteristics (color signature in crop)
                            is_emergency = self._check_emergency_crop(frame, (x1, y1, x2, y2))
                            if is_emergency:
                                class_name = "emergency"

                            detections.append({
                                "bbox": (x1, y1, x2, y2),
                                "class_name": class_name,
                                "confidence": round(conf, 2),
                                "is_emergency": is_emergency
                            })
                return detections, self.model_type
            except Exception as e:
                logger.warning(f"YOLO inference error: {e}. Falling back to OpenCV CV Detector.")

        # Robust Computer Vision Fallback (Real contour analysis, morphology & area filtering)
        # Convert to grayscale and blur
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        fg_mask = self.bg_subtractor.apply(blurred)

        # Threshold out shadows (shadows are gray value 127 in MOG2)
        _, thresh = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        dilated = cv2.dilate(thresh, kernel, iterations=2)
        closing = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, kernel, iterations=2)

        contours, _ = cv2.findContours(closing, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 400 or area > (w * h * 0.4):  # Filter out noise and massive frame transitions
                continue

            x, y, bw, bh = cv2.boundingRect(cnt)
            aspect_ratio = float(bw) / float(bh) if bh > 0 else 1.0

            # Estimate vehicle type from size and aspect ratio
            if area > 12000 or bh > 140:
                class_name = "bus" if aspect_ratio > 1.2 else "truck"
            elif area < 1500 and aspect_ratio < 0.8:
                class_name = "motorcycle"
            else:
                class_name = "car"

            conf = min(0.95, max(0.45, 0.4 + (area / 10000.0) * 0.4))
            is_emergency = self._check_emergency_crop(frame, (x, y, x + bw, y + bh))
            if is_emergency:
                class_name = "emergency"

            detections.append({
                "bbox": (x, y, x + bw, y + bh),
                "class_name": class_name,
                "confidence": round(conf, 2),
                "is_emergency": is_emergency
            })

        return detections, "opencv_adaptive_cv"

    def _check_emergency_crop(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> bool:
        """
        Inspects vehicle crop for emergency vehicle signatures (e.g. high red/blue strobe frequency or ambulance livery).
        """
        x1, y1, x2, y2 = bbox
        if x2 <= x1 or y2 <= y1:
            return False
        crop = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
        if crop.size == 0:
            return False

        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        
        # Red strobe mask
        lower_red1 = np.array([0, 100, 100])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([160, 100, 100])
        upper_red2 = np.array([180, 255, 255])
        
        # Blue strobe mask
        lower_blue = np.array([100, 120, 100])
        upper_blue = np.array([130, 255, 255])

        mask_red = cv2.bitwise_or(cv2.inRange(hsv, lower_red1, upper_red1), cv2.inRange(hsv, lower_red2, upper_red2))
        mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)

        red_ratio = np.count_nonzero(mask_red) / crop.size
        blue_ratio = np.count_nonzero(mask_blue) / crop.size

        # High density of emergency colors in top half (lightbar area)
        top_half = crop[:int(crop.shape[0] * 0.35), :]
        if top_half.size > 0:
            top_hsv = cv2.cvtColor(top_half, cv2.COLOR_BGR2HSV)
            top_red = cv2.bitwise_or(cv2.inRange(top_hsv, lower_red1, upper_red1), cv2.inRange(top_hsv, lower_red2, upper_red2))
            top_blue = cv2.inRange(top_hsv, lower_blue, upper_blue)
            top_strobe_ratio = (np.count_nonzero(top_red) + np.count_nonzero(top_blue)) / float(top_half.size)
            if top_strobe_ratio > 0.15:
                return True

        return (red_ratio > 0.18 and blue_ratio > 0.05)
