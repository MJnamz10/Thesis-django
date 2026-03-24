import cv2
from config import UPSCALE_FACTOR, CLAHE_CLIP_LIMIT, CLAHE_TILE_GRID_SIZE


class PreprocessingService:
    def upscale_image(self, image, scale=UPSCALE_FACTOR):
        return cv2.resize(
            image,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_CUBIC
        )

    def convert_to_grayscale(self, image):
        if len(image.shape) == 2:
            return image
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    def apply_clahe(self, gray_image):
        clahe = cv2.createCLAHE(
            clipLimit=CLAHE_CLIP_LIMIT,
            tileGridSize=CLAHE_TILE_GRID_SIZE
        )
        return clahe.apply(gray_image)

    def sharpen_image(self, image):
        blurred = cv2.GaussianBlur(image, (0, 0), 1.0)
        sharpened = cv2.addWeighted(image, 1.8, blurred, -0.8, 0)
        return sharpened

    def apply_otsu_threshold(self, image):
        _, binary = cv2.threshold(
            image,
            0,
            255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
        return binary