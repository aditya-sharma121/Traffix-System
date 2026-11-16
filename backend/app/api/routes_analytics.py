from fastapi import APIRouter, Body
from backend.app.simulation.baseline_comparator import BaselineComparator

router = APIRouter(prefix="/api/analytics", tags=["analytics"])
comparator = BaselineComparator()


@router.post("/benchmark")
def run_benchmark_test(
    duration_steps: int = Body(120, embed=True),
    intensity: str = Body("medium", embed=True)
):
    results = comparator.run_benchmark(duration_steps=duration_steps, traffic_intensity=intensity)
    return results


@router.get("/summary")
def get_analytics_summary():
    # Run a quick default benchmark to deliver fresh real stats
    res = comparator.run_benchmark(duration_steps=80, traffic_intensity="medium")
    return {
        "waiting_time_saved_percent": res["improvements"]["waiting_time_reduction_percent"],
        "throughput_gain_percent": res["improvements"]["throughput_increase_percent"],
        "queue_reduction_percent": res["improvements"]["queue_reduction_percent"],
        "co2_saved_kg": res["improvements"]["co2_emissions_saved_kg"],
        "fixed_avg_wait_sec": res["fixed_time_results"]["avg_waiting_time_sec"],
        "adaptive_avg_wait_sec": res["traffiq_adaptive_results"]["avg_waiting_time_sec"]
    }
