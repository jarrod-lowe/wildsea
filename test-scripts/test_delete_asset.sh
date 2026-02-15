#!/bin/bash
set -e

# Function to show usage
usage() {
    echo "Usage: $0 <username> <password> <game_id> <section_id>"
    echo ""
    echo "Arguments:"
    echo "  username    Cognito username for authentication"
    echo "  password    Cognito password for authentication"
    echo "  game_id     Game ID to test with"
    echo "  section_id  Section ID to test with (must belong to authenticated user)"
    echo ""
    echo "Example:"
    echo "  $0 username 'mypassword' 'cd69661a-57e4-450d-8670-1058958b1bfe' '9187e56a-07f2-4ca8-945a-264ad970e2e2'"
    exit 1
}

# Check if correct number of arguments provided
if [ $# -ne 4 ]; then
    echo "Error: Incorrect number of arguments"
    usage
fi

# Parse command line arguments
COGNITO_USERNAME="$1"
COGNITO_PASSWORD="$2"
GAME_ID="$3"
SECTION_ID="$4"

# Validate arguments are not empty
if [ -z "$COGNITO_USERNAME" ] || [ -z "$COGNITO_PASSWORD" ] || [ -z "$GAME_ID" ] || [ -z "$SECTION_ID" ]; then
    echo "Error: All arguments are required and cannot be empty"
    usage
fi

# Change to correct terraform directory and get outputs
cd terraform/environment/wildsea-dev
TERRAFORM_OUTPUT=$(AWS_PROFILE=wildsea terraform output -json)
cd - > /dev/null

# Parse terraform outputs using jq
GRAPHQL_URL=$(echo "$TERRAFORM_OUTPUT" | jq -r '.graphql_uri.value')
COGNITO_USER_POOL_ID=$(echo "$TERRAFORM_OUTPUT" | jq -r '.cognito_user_pool_id.value')
COGNITO_CLIENT_ID=$(echo "$TERRAFORM_OUTPUT" | jq -r '.cognito_web_client_id.value')
AWS_REGION=$(echo "$TERRAFORM_OUTPUT" | jq -r '.region.value')

echo "Running deleteAsset test in Docker container..."
echo "GraphQL URL: $GRAPHQL_URL"
echo "Game ID: $GAME_ID"
echo "Section ID: $SECTION_ID"
echo "Username: $COGNITO_USERNAME"
echo ""

# Build docker run command with required environment variables
docker run --rm \
    -v "$(pwd)/test-scripts/test_delete_asset.py:/test_delete_asset.py" \
    -e GRAPHQL_URL="$GRAPHQL_URL" \
    -e COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID" \
    -e COGNITO_CLIENT_ID="$COGNITO_CLIENT_ID" \
    -e AWS_REGION="$AWS_REGION" \
    -e GAME_ID="$GAME_ID" \
    -e SECTION_ID="$SECTION_ID" \
    -e COGNITO_USERNAME="$COGNITO_USERNAME" \
    -e COGNITO_PASSWORD="$COGNITO_PASSWORD" \
    -e AWS_DEFAULT_REGION="$AWS_REGION" \
    python:3.11-slim \
    bash -c "pip install boto3 requests && python -u /test_delete_asset.py"
