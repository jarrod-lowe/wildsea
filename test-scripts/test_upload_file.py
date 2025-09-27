#!/usr/bin/env python3
"""
Test script to upload a file using the presigned URL from requestAssetUpload.
"""

import json
import urllib.request
import urllib.parse
from urllib.parse import urlparse
import urllib.error

def create_test_image(file_path, size_bytes=1024000):
    """Create a test JPEG file of specified size"""
    # Create a simple test JPEG file
    # JPEG header for a minimal valid JPEG
    jpeg_header = bytes([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xC0, 0x00, 0x11,
        0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01,
        0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x08, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF,
        0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F,
        0x00
    ])

    # Fill the rest with valid JPEG data to reach the target size
    remaining_size = size_bytes - len(jpeg_header) - 2  # -2 for EOF marker
    filler_data = b'\x00' * remaining_size

    # JPEG EOF marker
    jpeg_eof = bytes([0xFF, 0xD9])

    with open(file_path, 'wb') as f:
        f.write(jpeg_header)
        f.write(filler_data)
        f.write(jpeg_eof)

    print(f"Created test JPEG file: {file_path} ({size_bytes} bytes)")

def upload_file_to_s3(upload_url, upload_fields_json, file_path):
    """Upload file to S3 using presigned POST"""

    # Parse the upload fields
    upload_fields = json.loads(upload_fields_json)

    print(f"Uploading file: {file_path}")
    print(f"Upload URL: {upload_url}")
    print(f"Upload fields keys: {list(upload_fields.keys())}")

    # Read the file
    with open(file_path, 'rb') as f:
        file_data = f.read()

    # Prepare multipart form data
    boundary = 'FormBoundary7MA4YWxkTrZu0gW'

    # Build the multipart body
    body_parts = []

    # Add all the form fields first
    for key, value in upload_fields.items():
        body_parts.append(f'--{boundary}'.encode())
        body_parts.append(f'Content-Disposition: form-data; name="{key}"'.encode())
        body_parts.append(b'')
        body_parts.append(str(value).encode())

    # Add the file last
    body_parts.append(f'--{boundary}'.encode())
    body_parts.append(b'Content-Disposition: form-data; name="file"; filename="test-image.jpg"')
    body_parts.append(b'Content-Type: image/jpeg')
    body_parts.append(b'')
    body_parts.append(file_data)
    body_parts.append(f'--{boundary}--'.encode())

    body = b'\r\n'.join(body_parts)

    # Create the request
    req = urllib.request.Request(
        upload_url,
        data=body,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Content-Length': str(len(body))
        }
    )

    try:
        with urllib.request.urlopen(req) as response:  # nosec B310
            response_data = response.read().decode('utf-8')
            print(f"Upload successful!")
            print(f"Status Code: {response.status}")
            print(f"Response: {response_data}")
            return True

    except urllib.error.HTTPError as e:
        error_response = e.read().decode('utf-8') if e.fp else str(e)
        print(f"Upload failed with HTTP {e.code}: {error_response}")
        return False
    except Exception as e:
        print(f"Upload failed with error: {str(e)}")
        return False

def main():
    import sys
    import os

    # Get upload URL and fields from command line arguments or environment variables
    upload_url = sys.argv[1] if len(sys.argv) > 1 else os.getenv('UPLOAD_URL')
    upload_fields_json = sys.argv[2] if len(sys.argv) > 2 else os.getenv('UPLOAD_FIELDS')

    if not upload_url or not upload_fields_json:
        print("Error: Missing upload URL and fields")
        print("Usage: python3 test_upload_file.py <upload_url> '<upload_fields_json>'")
        print("   or: UPLOAD_URL='...' UPLOAD_FIELDS='...' python3 test_upload_file.py")
        sys.exit(1)

    # Create test file
    test_file_path = "/tmp/claude/test-image.jpg"
    create_test_image(test_file_path, 1024000)  # Exactly 1MB as specified in the request

    # Upload the file
    success = upload_file_to_s3(upload_url, upload_fields_json, test_file_path)

    if success:
        print("\n✅ File upload completed successfully!")
        print("The complete requestAssetUpload + file upload pipeline is working!")
    else:
        print("\n❌ File upload failed!")

if __name__ == "__main__":
    main()