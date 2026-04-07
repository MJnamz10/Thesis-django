import os

# -----------------------------
# PostgreSQL Configuration
# -----------------------------
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "thesis_qr"
DB_USER = "postgres"
DB_PASSWORD = "mizijen"

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SVG_PATH = os.path.join(BASE_DIR, "Verifi.svg")
MODEL_PATH = os.path.join(BASE_DIR, "model", "best.pt")

# NEW: backend/media paths
PROJECT_ROOT = os.path.dirname(BASE_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
MEDIA_DIR = os.path.join(BACKEND_DIR, "media")
STUDENT_PHOTOS_DIR = os.path.join(MEDIA_DIR, "student_photos")

# -----------------------------
# Runtime
# -----------------------------
DEVICE = "cpu"

# -----------------------------
# Camera Settings
# -----------------------------
CAMERA_INDEX = 0
#CAPTURE_WIDTH = 3840
#CAPTURE_HEIGHT = 2160

CAPTURE_WIDTH = 1920#3840 #800
CAPTURE_HEIGHT = 1080#2160 #600


# Detection resolution
DETECT_WIDTH = 1080#416
DETECT_HEIGHT = 1080#416

# Preview/display resolution
DISPLAY_WIDTH = 640
DISPLAY_HEIGHT = 480

# -----------------------------
# YOLO Settings
# -----------------------------
YOLO_CONF = 0.50
YOLO_IMGSZ = 416

# -----------------------------
# Processing Control
# -----------------------------
PROCESS_EVERY_N_FRAMES = 6 #origiinal
SCAN_COOLDOWN_MS = 0#5000

# -----------------------------
# Crop / Quality Gate
# -----------------------------
CROP_MARGIN = 8
MIN_QR_WIDTH = 60
MIN_QR_HEIGHT = 60
MIN_SHARPNESS = 20.0

# Only decode the top-N detections
MAX_DETECTIONS_TO_DECODE = 10

# -----------------------------
# Preprocessing
# -----------------------------
UPSCALE_FACTOR = 3.0
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID_SIZE = (8, 8)

REMOTE_DETECTOR_URL = "http://192.168.x.x:8000"