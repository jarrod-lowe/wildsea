#!/bin/bash -eu
if [ -z "${1:-}" ] ; then
    echo >&2 "Usage: $0 <aws-account-id> [environment] [region]"
    echo >&2 "Eg: $0 0123456789012"
    exit 2
fi

DIR="$( dirname "$0" )"
cd "${DIR}"

ACCOUNT_ID="$1"
ENVIRONMENT="${2:-primary}"
AWS_REGION="${3:-ap-southeast-2}"
STATE_BUCKET="terraform-state-${ACCOUNT_ID}"

if ! aws help >/dev/null ; then
    echo >&2 "Error: aws cli not installed"
    exit 3
fi

if ! aws sts get-caller-identity >/dev/null ; then
    echo >&2 "Error: not logged into AWS"
    exit 4
fi

if ! aws s3 ls "s3://${STATE_BUCKET}/" >/dev/null ; then
    echo >&2 "Error: AWS Role does not have access to the state bucket"
    aws sts get-caller-identity
    exit 5
fi

terraform init \
    -backend-config="bucket=${STATE_BUCKET}" \
    -backend-config="key=${ENVIRONMENT}/github.tfstate" \
    -backend-config="region=${AWS_REGION}"

terraform apply \
    -var aws_account="${ACCOUNT_ID}" \
    -var aws_region="${AWS_REGION}" \
    -var environment="${ENVIRONMENT}" \
    -var state_bucket="${STATE_BUCKET}"