import json
import boto3
from botocore.exceptions import ClientError

# Constants
PRESIGNED_URL_EXPIRES_SECONDS = 900  # 15 minutes

def lambda_handler(event, context):
    """
    Generate S3 presigned POST URL for file upload

    Expected input from AppSync pipeline:
    {
        "assetData": {
            "bucket": "bucket-name",
            "originalKey": "path/to/file",
            "mimeType": "image/jpeg",
            "sizeBytes": 1024
        },
        "input": {
            "sizeBytes": 1024,
            "mimeType": "image/jpeg"
        }
    }
    """

    try:
        # Extract data from previous pipeline function
        asset_data = event.get('assetData', {})
        input_data = event.get('input', {})

        bucket = asset_data.get('bucket')
        key = asset_data.get('originalKey')
        mime_type = input_data.get('mimeType')
        size_bytes = input_data.get('sizeBytes')

        if not all([bucket, key, mime_type, size_bytes]):
            raise ValueError("Missing required parameters: bucket, key, mimeType, or sizeBytes")

        # Create S3 client
        s3_client = boto3.client('s3')

        # Conditions for the presigned POST
        conditions = [
            {"Content-Type": mime_type},
            ["content-length-range", size_bytes, size_bytes],  # Exact size match
        ]

        # Generate presigned POST
        response = s3_client.generate_presigned_post(
            Bucket=bucket,
            Key=key,
            Fields={"Content-Type": mime_type},
            Conditions=conditions,
            ExpiresIn=PRESIGNED_URL_EXPIRES_SECONDS
        )

        # Return both asset data and presigned URL for final response
        return {
            'assetData': asset_data,
            'uploadUrl': response['url'],
            'uploadFields': response['fields']
        }

    except ClientError as e:
        print(f"AWS error: {str(e)}")
        raise Exception(f"Failed to generate presigned URL: {str(e)}")
    except Exception as e:
        print(f"Error: {str(e)}")
        raise Exception(f"Failed to generate presigned URL: {str(e)}")