# Test Scripts for requestAssetUpload

This directory contains test scripts for validating the requestAssetUpload GraphQL mutation and file upload functionality.

## Scripts

### test_request_asset_upload.sh
Shell script that tests the requestAssetUpload GraphQL mutation using Docker.

**Usage:**
```bash
COGNITO_USERNAME='username' COGNITO_PASSWORD='password' \
GAME_ID='game-id' SECTION_ID='section-id' \
./test-scripts/test_request_asset_upload.sh
```

**Requirements:**
- Valid Cognito credentials
- Game ID and Section ID that belong to the authenticated user
- Docker installed
- AWS profile configured

### test_request_asset_upload.py
Python script that authenticates with Cognito and calls the requestAssetUpload mutation.

**Features:**
- Cognito authentication
- GraphQL mutation execution
- Secure URL validation
- Error handling

### test_upload_file.py
Python script that uploads a test file using presigned S3 URLs.

**Usage:**
```bash
python3 test_upload_file.py "<upload_url>" '<upload_fields_json>'
```

**Features:**
- Creates a valid JPEG test file
- Performs multipart form upload to S3
- Validates upload success

## Example Workflow

1. First, get upload credentials:
```bash
COGNITO_USERNAME='your-username' COGNITO_PASSWORD='your-password' \
GAME_ID='your-game-id' SECTION_ID='your-section-id' \
./test-scripts/test_request_asset_upload.sh
```

2. Then upload a file using the returned URL and fields:
```bash
python3 test-scripts/test_upload_file.py "https://bucket.s3.amazonaws.com/" '{"key":"path","policy":"...","signature":"..."}'
```

## Security Notes

- Scripts do not contain hardcoded credentials
- All sensitive data must be provided via environment variables
- Presigned URLs expire after 15 minutes
- Test files are created in `/tmp/claude/` directory