from pyzbar.pyzbar import decode
from services.preprocessing_service import PreprocessingService


class DecoderService:
    def __init__(self):
        self.preprocessor = PreprocessingService()

    def _decode_with_pyzbar(self, image):
        results = decode(image)
        if not results:
            return []

        decoded_texts = []
        for item in results:
            try:
                decoded_texts.append(item.data.decode("utf-8"))
            except UnicodeDecodeError:
                decoded_texts.append(item.data.decode("utf-8", errors="replace"))
        return decoded_texts

    def decode_adaptive(self, crop):
        # ---------------------------------------------------------
        # Stage 0: Original Crop
        # Fastest stage. Works 80% of the time for good cameras.
        # ---------------------------------------------------------
        decoded = self._decode_with_pyzbar(crop)
        if decoded:
            return {
                "success": True,
                "decoded_text": decoded[0],
                "stage": "ORIGINAL",
                "decoded_texts": decoded,
            }

        # ---------------------------------------------------------
        # Stage 1: Grayscale + Otsu Threshold
        # Very fast matrix operations. Fixes dim lighting, shadows, 
        # and low-contrast IDs instantly.
        # ---------------------------------------------------------
        gray = self.preprocessor.convert_to_grayscale(crop)
        otsu = self.preprocessor.apply_otsu_threshold(gray)
        
        decoded = self._decode_with_pyzbar(otsu)
        if decoded:
            return {
                "success": True,
                "decoded_text": decoded[0],
                "stage": "GRAYSCALE_OTSU",
                "decoded_texts": decoded,
            }

        # ---------------------------------------------------------
        # Stage 2: Upscaled
        # Expensive operation (Cubic Interpolation). Only runs if 
        # the QR code is physically too small for PyZbar's grid.
        # We upscale the 'gray' image instead of the BGR one to save RAM.
        # ---------------------------------------------------------
        upscaled = self.preprocessor.upscale_image(gray)
        decoded = self._decode_with_pyzbar(upscaled)
        if decoded:
            return {
                "success": True,
                "decoded_text": decoded[0],
                "stage": "UPSCALED",
                "decoded_texts": decoded,
            }

        # If all 3 stages fail, reject the crop and wait for the next frame.
        return {
            "success": False,
            "decoded_text": None,
            "stage": "NONE",
            "decoded_texts": [],
        }