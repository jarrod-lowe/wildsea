#!/bin/bash -eu

ROLE_ARN=$1
shift
COMMAND=$@

CREDS=$(aws sts assume-role --role-arn "$ROLE_ARN" --role-session-name "terraform-${RANDOM}" --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' --output text)

export AWS_ACCESS_KEY_ID="$(echo "${CREDS}" | awk '{print $1}')"
export AWS_SECRET_ACCESS_KEY="$(echo "${CREDS}" | awk '{print $2}')"
export AWS_SESSION_TOKEN="$(echo "${CREDS}" | awk '{print $3}')"

exec $COMMAND
