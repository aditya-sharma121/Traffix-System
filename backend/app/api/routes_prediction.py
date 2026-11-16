from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.prediction.congestion_predictor import CongestionPredictor

router = APIRouter(prefix="/api/prediction", tags=["prediction"])
predictor = CongestionPredictor()


class PredictionRequest(BaseModel):
    hour_of_day: int = 17
    is_weekend: bool = False
    vehicle_count: int = 42
    current_density_pct: float = 65.0
    weather: str = "clear"
    prev_cycle_wait: float = 32.0
    incident: bool = False


@router.post("/predict")
def predict_traffic_congestion(req: PredictionRequest):
    return predictor.predict_congestion(
        hour_of_day=req.hour_of_day,
        is_weekend=req.is_weekend,
        vehicle_count=req.vehicle_count,
        current_density_pct=req.current_density_pct,
        weather=req.weather,
        prev_cycle_wait=req.prev_cycle_wait,
        incident=req.incident
    )


@router.get("/metrics")
def get_prediction_metrics():
    return predictor.evaluation_metrics


@router.post("/retrain")
def retrain_model():
    predictor._initialize_or_train()
    return {
        "status": "success",
        "message": "Models retrained successfully.",
        "metrics": predictor.evaluation_metrics
    }
