import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.detection.video_processor import VideoProcessor
from backend.app.database.db import get_db
from backend.app.database.models import TrafficSession

router = APIRouter(prefix="/api/detection", tags=["detection"])
processor = VideoProcessor()

UPLOAD_DIR = "./uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    frame_skip: int = Form(2),
    max_frames: int = Form(150),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith((".mp4", ".avi", ".mov", ".mkv")):
        raise HTTPException(status_code=400, detail="Unsupported video format. Please upload MP4, AVI, or MOV.")

    save_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        results = processor.process_video_file(save_path, frame_skip=frame_skip, max_frames=max_frames)

        # Save session to database
        density = results["latest_density_analysis"]["directions"]
        session_record = TrafficSession(
            session_id=f"sess_{int(results['processing_time_sec'] * 1000)}",
            video_filename=file.filename,
            total_vehicles=results["total_unique_vehicles_tracked"],
            density_north=density.get("NORTH", {}).get("density_percent", 0.0),
            density_south=density.get("SOUTH", {}).get("density_percent", 0.0),
            density_east=density.get("EAST", {}).get("density_percent", 0.0),
            density_west=density.get("WEST", {}).get("density_percent", 0.0),
            summary=results
        )
        db.add(session_record)
        db.commit()

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")


@router.post("/sample-generate")
async def generate_and_analyze_sample(db: Session = Depends(get_db)):
    """Generates a sample traffic video and analyzes it instantly for one-click demo."""
    sample_path = "./datasets/sample_traffic.mp4"
    VideoProcessor.generate_synthetic_traffic_video(sample_path, duration_sec=6)
    results = processor.process_video_file(sample_path, frame_skip=1, max_frames=120)

    density = results["latest_density_analysis"]["directions"]
    session_record = TrafficSession(
        session_id=f"sample_{int(results['processing_time_sec'] * 1000)}",
        video_filename="sample_traffic.mp4",
        total_vehicles=results["total_unique_vehicles_tracked"],
        density_north=density.get("NORTH", {}).get("density_percent", 0.0),
        density_south=density.get("SOUTH", {}).get("density_percent", 0.0),
        density_east=density.get("EAST", {}).get("density_percent", 0.0),
        density_west=density.get("WEST", {}).get("density_percent", 0.0),
        summary=results
    )
    db.add(session_record)
    db.commit()

    return results


@router.get("/status")
def get_detector_status():
    return {
        "is_processing": processor.is_processing,
        "progress_percent": processor.progress_percent,
        "model_type": processor.detector.model_type,
        "tracker_active": True
    }


@router.get("/latest")
def get_latest_results():
    if not processor.last_results:
        # Return default initialized demo result if no video processed yet
        return {"status": "no_video_processed_yet"}
    return processor.last_results
