import qrcode
from django.http import HttpResponse

def generate_qr(request):
    # 1. Grab the 'data' parameter from the URL (e.g., ?data=Student123)
    # If it's missing, default to a safe string so it doesn't crash.
    qr_data = request.GET.get('data', 'Please provide data')

    # 2. Configure the QR code size and error correction
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    # 3. Create the actual image
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # 4. Package it as a PNG and send it back to the browser
    response = HttpResponse(content_type="image/png")
    img.save(response, "PNG")
    return response