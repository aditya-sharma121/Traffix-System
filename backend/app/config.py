import os
from pathlib import Path


def load_dotenv(dotenv_path: Path = None):
    """
    Zero-dependency standard library .env loader.
    Safely reads key-value pairs from .env and populates os.environ
    without requiring third-party packages.
    """
    if dotenv_path is None:
        dotenv_path = Path(__file__).resolve().parent.parent.parent / ".env"

    if not dotenv_path.exists():
        return

    try:
        with open(dotenv_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                if key and key not in os.environ:
                    os.environ[key] = val
    except Exception as e:
        print(f"[TRAFFIQ Config] Warning: Could not load .env file: {e}")


# Automatically load on import
load_dotenv()
