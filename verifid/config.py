import os
import torch


# --- PostgreSQL Configuration ---
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "thesis_qr"
DB_USER = "postgres"
DB_PASSWORD = "mizijen"

# --- NEW API Configuration ---
#API_BASE_URL = "http://localhost:8000/api"
#API_KEY = "USTP_Gate_Scanner_Key_9x8B2vL5y" 

# File Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SVG_PATH = os.path.join(BASE_DIR, "Verifi.svg")
MODEL_PATH = os.path.join(BASE_DIR, "model", "best.pt")

# Hardware Configuration
DEVICE = "cpu"