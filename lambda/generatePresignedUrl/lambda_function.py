import json
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

# Constants
PRESIGNED_URL_EXPIRES_SECONDS = 900  # 15 minutes

# Initialize S3 client outside handler for better performance
# Configure with timeout to prevent hanging executions
s3_client = boto3.client('s3', config=Config(
    read_timeout=30,
    connect_timeout=5,
    retries={'max_attempts': 3}
))

class PresignedUrlError(Exception):
    """Custom exception for presigned URL generation errors"""
    pass

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
        key = asset_data.get('incomingKey')
        mime_type = input_data.get('mimeType')
        size_bytes = input_data.get('sizeBytes')
        game_id = asset_data.get('gameId')
        section_id = asset_data.get('sectionId')
        asset_id = asset_data.get('assetId')
        created_at = asset_data.get('createdAt')

        if not all([bucket, key, mime_type, size_bytes is not None, game_id, section_id, asset_id, created_at]):
            raise ValueError("Missing required parameters: bucket, key, mimeType, sizeBytes, gameId, sectionId, assetId, or createdAt")

        # Fields to include in the presigned POST (including custom headers)
        fields = {
            "Content-Type": mime_type,
            "x-amz-meta-gameid": game_id,
            "x-amz-meta-sectionid": section_id,
            "x-amz-meta-assetid": asset_id,
            "x-amz-meta-requestedtime": created_at
        }

        # Conditions for the presigned POST
        conditions = [
            {"Content-Type": mime_type},
            ["content-length-range", size_bytes, size_bytes],  # Exact size match
            {"x-amz-meta-gameid": game_id},
            {"x-amz-meta-sectionid": section_id},
            {"x-amz-meta-assetid": asset_id},
            {"x-amz-meta-requestedtime": created_at}
        ]

        # Generate presigned POST
        response = s3_client.generate_presigned_post(
            Bucket=bucket,
            Key=key,
            Fields=fields,
            Conditions=conditions,
            ExpiresIn=PRESIGNED_URL_EXPIRES_SECONDS
        )

        # Extract headers that client needs to send
        headers = {
            "gameId": game_id,
            "sectionId": section_id,
            "assetId": asset_id,
            "requestedTime": created_at
        }

        # Return both asset data and presigned URL for final response
        return {
            'assetData': asset_data,
            'uploadUrl': response['url'],
            'uploadFields': response['fields'],
            'headers': headers
        }

    except ClientError as e:
        print(f"AWS error: {str(e)}")
        raise PresignedUrlError(f"Failed to generate presigned URL: {str(e)}")
    except ValueError as e:
        print(f"Validation error: {str(e)}")
        raise PresignedUrlError(f"Invalid parameters: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise PresignedUrlError(f"Failed to generate presigned URL: {str(e)}")