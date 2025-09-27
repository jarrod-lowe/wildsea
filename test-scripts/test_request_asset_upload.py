#!/usr/bin/env python3
"""
Test script to call the requestAssetUpload GraphQL mutation with Cognito authentication.
"""

import json
import sys
import os
import urllib.request
from urllib.parse import urlparse
import urllib.error

def _validate_https_url(url: str, allowed_hosts=None):
    """Raise ValueError unless url is https:// and (optionally) host is allowed."""
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError("URL must be HTTPS, contain a host, and have no credentials")
    if allowed_hosts:
        host = (parsed.hostname or "").lower()
        if not any(host == h or host.endswith("." + h) for h in (h.lower() for h in allowed_hosts)):
            raise ValueError(f"Host '{host}' is not in the allowed list")

def get_cognito_token(username, password, user_pool_id, client_id, region):
    """Authenticate with Cognito and get access token"""

    # Validate region to ensure we only hit AWS endpoints
    if not region or not region.replace('-', '').isalnum():
        raise ValueError("Invalid AWS region")

    # Cognito Identity Provider endpoint
    cognito_idp_url = f"https://cognito-idp.{region}.amazonaws.com/"
    _validate_https_url(cognito_idp_url, allowed_hosts=["amazonaws.com"])

    payload = {
        'AuthFlow': 'USER_PASSWORD_AUTH',
        'ClientId': client_id,
        'AuthParameters': {
            'USERNAME': username,
            'PASSWORD': password
        }
    }

    data = json.dumps(payload).encode('utf-8')

    req = urllib.request.Request(
        cognito_idp_url,
        data=data,
        headers={
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
            'Content-Type': 'application/x-amz-json-1.1'
        }
    )

    try:
        with urllib.request.urlopen(req) as response:  # nosec B310
            result = json.loads(response.read().decode('utf-8'))

        if 'AuthenticationResult' in result:
            return result['AuthenticationResult']['AccessToken']
        else:
            return None

    except urllib.error.HTTPError:
        return None

def test_request_asset_upload(access_token, graphql_url, game_id, section_id):
    """Test the requestAssetUpload mutation"""

    # Validate GraphQL URL
    _validate_https_url(graphql_url)

    mutation = """
    mutation RequestAssetUpload($input: RequestAssetUploadInput!) {
        requestAssetUpload(input: $input) {
            uploadUrl
            uploadFields
            asset {
                gameId
                sectionId
                assetId
                status
                mimeType
                sizeBytes
                createdAt
                type
            }
        }
    }
    """

    variables = {
        "input": {
            "gameId": game_id,
            "sectionId": section_id,
            "mimeType": "image/jpeg",
            "sizeBytes": 1024000,  # 1MB
            "label": "Test image upload"
        }
    }

    payload = {
        "query": mutation,
        "variables": variables
    }

    data = json.dumps(payload).encode('utf-8')

    req = urllib.request.Request(
        graphql_url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
    )

    try:
        with urllib.request.urlopen(req) as response:  # nosec B310
            result = json.loads(response.read().decode('utf-8'))

        print("Response:")
        print(json.dumps(result, indent=2))

        if 'errors' in result:
            print(f"\nERROR: {result['errors'][0].get('message', 'GraphQL error')}")
            return False

        if 'data' in result and result['data'].get('requestAssetUpload'):
            upload_result = result['data']['requestAssetUpload']
            print(f"\nSUCCESS!")
            print(f"Asset ID: {upload_result['asset']['assetId']}")
            print(f"Upload URL: {upload_result['uploadUrl']}")
            print(f"Upload Fields: {upload_result['uploadFields']}")
            print(f"Status: {upload_result['asset']['status']}")
            return True
        else:
            print("\nERROR: No upload data returned")
            return False

    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def main():
    # Get required environment variables
    graphql_url = os.getenv('GRAPHQL_URL')
    user_pool_id = os.getenv('COGNITO_USER_POOL_ID')
    client_id = os.getenv('COGNITO_CLIENT_ID')
    region = os.getenv('AWS_REGION')
    game_id = os.getenv('GAME_ID')
    section_id = os.getenv('SECTION_ID')
    username = os.getenv('COGNITO_USERNAME')
    password = os.getenv('COGNITO_PASSWORD')

    if not all([graphql_url, user_pool_id, client_id, region, game_id, section_id, username, password]):
        print("Error: Missing required environment variables")
        print("Required: GRAPHQL_URL, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, AWS_REGION, GAME_ID, SECTION_ID, COGNITO_USERNAME, COGNITO_PASSWORD")
        sys.exit(1)

    print("Getting Cognito access token...")
    access_token = get_cognito_token(username, password, user_pool_id, client_id, region)

    if not access_token:
        print("Failed to get access token")
        sys.exit(1)

    print(f"Testing requestAssetUpload mutation...")
    print(f"Game ID: {game_id}")
    print(f"Section ID: {section_id}")

    success = test_request_asset_upload(access_token, graphql_url, game_id, section_id)

    if success:
        print("\n✓ requestAssetUpload test completed successfully!")
    else:
        print("\n✗ requestAssetUpload test failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()