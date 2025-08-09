#!/bin/bash
set -e

# Change to correct terraform directory and get outputs
cd terraform/environment/wildsea-dev
TERRAFORM_OUTPUT=$(AWS_PROFILE=wildsea terraform output -json)
cd - > /dev/null

# Parse terraform outputs using jq
GRAPHQL_URL=$(echo "$TERRAFORM_OUTPUT" | jq -r '.graphql_uri.value')
COGNITO_USER_POOL_ID=$(echo "$TERRAFORM_OUTPUT" | jq -r '.cognito_user_pool_id.value')
COGNITO_CLIENT_ID=$(echo "$TERRAFORM_OUTPUT" | jq -r '.cognito_web_client_id.value')
AWS_REGION=$(echo "$TERRAFORM_OUTPUT" | jq -r '.region.value')

# GAME_ID is required - no default test-game-id
if [ -z "$GAME_ID" ]; then
    echo "Error: GAME_ID environment variable is required"
    echo "You need a real game ID from your wildsea application"
    exit 1
fi

# Check required username/password
if [ -z "$COGNITO_USERNAME" ] || [ -z "$COGNITO_PASSWORD" ]; then
    echo "Error: COGNITO_USERNAME and COGNITO_PASSWORD are required"
    echo "Usage:"
    echo "  GAME_ID='real-game-id' COGNITO_USERNAME='user' COGNITO_PASSWORD='pass' ./scripts/test_roll_dice.sh"
    exit 1
fi

echo "Running rollDice test in Docker container..."
echo "GraphQL URL: $GRAPHQL_URL"
echo "Game ID: $GAME_ID"
echo "Username: $COGNITO_USERNAME"

# Build docker run command with required environment variables
docker run --rm \
    -v "$(pwd)/scripts/test_roll_dice.py:/test_roll_dice.py" \
    -e GRAPHQL_URL="$GRAPHQL_URL" \
    -e COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID" \
    -e COGNITO_CLIENT_ID="$COGNITO_CLIENT_ID" \
    -e AWS_REGION="$AWS_REGION" \
    -e GAME_ID="$GAME_ID" \
    -e COGNITO_USERNAME="$COGNITO_USERNAME" \
    -e COGNITO_PASSWORD="$COGNITO_PASSWORD" \
    python:3.11-slim \
    python -u /test_roll_dice.py "$1"