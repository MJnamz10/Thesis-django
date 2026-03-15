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
        # Stage 0: Original
        decoded = self._decode_with_pyzbar(crop)
        if decoded:
            return {
                "success": True,
                "decoded_text": decoded[0],
                "stage": "ORIGINAL",
                "decoded_texts": decoded,
            }

        # Stage 1: Upscaled
        upscaled = self.preprocessor.upscale_image(crop)
        decoded = self._decode_with_pyzbar(upscaled)
        if decoded:
            return {
                "success": True,
                "decoded_text": decoded[0],
                "stage": "UPSCALED",
                "decoded_texts": decoded,
            }

        # Stage 2: Grayscale
        gray = self.preprocessor.convert_to_grayscale(upscaled)
        decoded = self._decode_with_pyzbar(gray)
        if decoded:
            return {
                "success": True,
                "decoded_text": decoded[0],
                "stage": "GRAYSCALE",
                "decoded_texts": decoded,
            }

        # Stage 3: CLAHE
        clahe = self.preprocessor.apply_clahe(gray)
        decoded = self._decode_with_pyzbar(clahe)
        if decoded:
            return {
                "success": True,
                "decoded_text": decoded[0],
                "stage": "CLAHE",
                "decoded_texts": decoded,
            }

        # Stage 4: Sharpened
        sharpened = self.preprocessor.sharpen_image(clahe)
        decoded = self._decode_with_pyzbar(sharpened)
        if decoded:
            return {
                "success": True,
                "decoded_text": decoded[0],
                "stage": "SHARPENED",
                "decoded_texts": decoded,
            }

        # Stage 5: Otsu
        otsu = self.preprocessor.apply_otsu_threshold(sharpened)
        decoded = self._decode_with_pyzbar(otsu)
        if decoded:
            return {
                "success": True,
                "decoded_text": decoded[0],
                "stage": "OTSU",
                "decoded_texts": decoded,
            }

        return {
            "success": False,
            "decoded_text": None,
            "stage": "NONE",
            "decoded_texts": [],
        }