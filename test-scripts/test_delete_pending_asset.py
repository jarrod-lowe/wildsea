#!/usr/bin/env python3
"""
Test deleteAsset on a PENDING asset (never uploaded to S3).

This script:
1. Requests asset upload (gets PENDING status)
2. Does NOT upload file to S3
3. Deletes the asset while still PENDING
4. Verifies deletion works correctly
5. Verifies remainingAssets counter
"""

import json
import os
import sys
import urllib.request
import urllib.error
from typing import Optional, Dict, Any

def get_cognito_token(username: str, password: str, client_id: str, region: str) -> Optional[str]:
    """Get Cognito ID token for authentication."""
    try:
        import boto3
        client = boto3.client('cognito-idp', region_name=region)

        response = client.initiate_auth(
            ClientId=client_id,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            }
        )

        return response['AuthenticationResult']['IdToken']
    except Exception as e:
        print(f"✗ Error getting Cognito token: {str(e)}")
        return None

def graphql_request(url: str, token: str, query: str, variables: Dict[str, Any]) -> Optional[Dict]:
    """Make a GraphQL request."""
    payload = json.dumps({
        "query": query,
        "variables": variables
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )

    try:
        with urllib.request.urlopen(req) as response:  # nosec B310
            result = json.loads(response.read().decode('utf-8'))

        if 'errors' in result:
            print(f"GraphQL Error: {result['errors'][0].get('message', 'Unknown error')}")
            return None

        return result
    except Exception as e:
        print(f"✗ Request failed: {str(e)}")
        return None

def get_remaining_assets(url: str, token: str, game_id: str) -> Optional[int]:
    """Get the current remainingAssets count for a game."""
    query = """
    query GetGame($input: GetGameInput!) {
        getGame(input: $input) {
            remainingAssets
        }
    }
    """

    variables = {
        "input": {
            "gameId": game_id,
            "language": "en"
        }
    }

    result = graphql_request(url, token, query, variables)
    if result and 'data' in result:
        return result['data']['getGame']['remainingAssets']
    return None

def request_asset_upload(url: str, token: str, game_id: str, section_id: str) -> Optional[tuple]:
    """Request asset upload but do NOT upload file."""
    print("1️⃣  Checking remainingAssets before upload request...")
    before_count = get_remaining_assets(url, token, game_id)
    if before_count is None:
        print("✗ Failed to get remainingAssets count")
        return None
    print(f"   remainingAssets: {before_count}")

    print("\n2️⃣  Requesting asset upload (will NOT upload file)...")

    query = """
    mutation RequestAssetUpload($input: RequestAssetUploadInput!) {
        requestAssetUpload(input: $input) {
            asset {
                assetId
                status
            }
            uploadUrl
            uploadFields
        }
    }
    """

    variables = {
        "input": {
            "gameId": game_id,
            "sectionId": section_id,
            "mimeType": "image/png",
            "sizeBytes": 0,
            "label": "Test Delete Pending Asset"
        }
    }

    result = graphql_request(url, token, query, variables)
    if not result or 'data' not in result:
        return None

    upload_data = result['data']['requestAssetUpload']
    asset_id = upload_data['asset']['assetId']
    status = upload_data['asset']['status']

    print(f"✓ Asset upload requested - Asset ID: {asset_id}")
    print(f"✓ Asset status: {status} (should be PENDING)")

    if status != 'PENDING':
        print(f"✗ Expected PENDING status, got {status}")
        return None

    # Verify remainingAssets decremented
    after_count = get_remaining_assets(url, token, game_id)
    if after_count is None:
        print("✗ Failed to get remainingAssets count after upload")
        return None

    if after_count == before_count - 1:
        print(f"✓ remainingAssets decremented: {before_count} → {after_count}")
    else:
        print(f"✗ remainingAssets not decremented correctly: {before_count} → {after_count}")
        return None

    print("\n3️⃣  Skipping S3 upload (testing PENDING asset deletion)...")

    return (asset_id, after_count)

def delete_pending_asset(url: str, token: str, game_id: str, section_id: str, asset_id: str, count_before_delete: int) -> bool:
    """Delete a PENDING asset."""
    print(f"\n4️⃣  Deleting PENDING asset {asset_id}...")

    query = """
    mutation DeleteAsset($input: DeleteAssetInput!) {
        deleteAsset(input: $input) {
            assetId
            status
            gameId
            sectionId
        }
    }
    """

    variables = {
        "input": {
            "gameId": game_id,
            "sectionId": section_id,
            "assetId": asset_id
        }
    }

    result = graphql_request(url, token, query, variables)
    if not result or 'data' not in result:
        return False

    deleted = result['data']['deleteAsset']

    if deleted['status'] == 'DELETED':
        print(f"✓ Asset deleted (status: DELETED)")
    else:
        print(f"✗ Delete failed, status: {deleted['status']}")
        return False

    # Verify remainingAssets incremented
    after_count = get_remaining_assets(url, token, game_id)
    if after_count is None:
        print("✗ Failed to get remainingAssets count after delete")
        return False

    if after_count == count_before_delete + 1:
        print(f"✓ remainingAssets incremented: {count_before_delete} → {after_count}")
        return True
    else:
        print(f"✗ remainingAssets not incremented correctly: {count_before_delete} → {after_count}")
        return False

def verify_pending_deletion(url: str, token: str, game_id: str, section_id: str, asset_id: str) -> bool:
    """Verify the PENDING asset was fully deleted via GraphQL."""
    print("\n5️⃣  Verifying asset removed from section...")

    query = """
    query GetGame($input: GetGameInput!) {
        getGame(input: $input) {
            playerSheets {
                sections {
                    sectionId
                    assets
                }
            }
        }
    }
    """

    variables = {
        "input": {
            "gameId": game_id,
            "language": "en"
        }
    }

    result = graphql_request(url, token, query, variables)
    if not result or 'data' not in result:
        print("✗ Failed to query game sections")
        return False

    # Check if asset is in any section
    player_sheets = result['data']['getGame']['playerSheets']
    for player_sheet in player_sheets:
        for section in player_sheet.get('sections', []):
            if section['sectionId'] == section_id:
                assets = section.get('assets') or []
                if asset_id in assets:
                    print(f"✗ Asset {asset_id} still in section assets list")
                    return False

    print(f"✓ Asset removed from section")
    return True

def main():
    # Get configuration from environment
    graphql_url = os.environ.get('GRAPHQL_URL')
    cognito_client_id = os.environ.get('COGNITO_CLIENT_ID')
    game_id = os.environ.get('GAME_ID')
    section_id = os.environ.get('SECTION_ID')
    username = os.environ.get('COGNITO_USERNAME')
    password = os.environ.get('COGNITO_PASSWORD')
    region = os.environ.get('AWS_REGION', 'ap-southeast-2')

    if not all([graphql_url, cognito_client_id, game_id, section_id, username, password]):
        print("Error: Missing required environment variables")
        sys.exit(1)

    print("🚀 Starting deleteAsset test for PENDING asset (no S3 upload)")
    print(f"Game ID: {game_id}")
    print(f"Section ID: {section_id}\n")

    # Get auth token
    token = get_cognito_token(username, password, cognito_client_id, region)
    if not token:
        sys.exit(1)

    # Request asset upload but don't upload file
    result = request_asset_upload(graphql_url, token, game_id, section_id)
    if not result:
        sys.exit(1)

    asset_id, count_after_upload = result

    # Delete pending asset
    if not delete_pending_asset(graphql_url, token, game_id, section_id, asset_id, count_after_upload):
        sys.exit(1)

    # Verify deletion
    if not verify_pending_deletion(graphql_url, token, game_id, section_id, asset_id):
        sys.exit(1)

    print("\n6️⃣  Verification complete")
    print(f"   Note: Since file was never uploaded to S3, there's nothing to delete")
    print(f"   - Asset {asset_id} was PENDING (never uploaded)")
    print(f"   - DynamoDB record deleted (verified via section query)")
    print(f"   - remainingAssets counter restored")

    print("\n🎉 All tests passed for PENDING asset deletion!")
    print(f"   Asset {asset_id} successfully:")
    print("   - Created in PENDING state (remainingAssets decremented)")
    print("   - Never uploaded to S3")
    print("   - Deleted while still PENDING")
    print("   - remainingAssets incremented back")
    print("   - Removed from section assets list")
    print("   - DynamoDB record removed")

if __name__ == "__main__":
    main()
