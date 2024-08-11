data "aws_iam_policy_document" "ro" {
  statement {
    sid = "ReadState"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "${var.state_bucket_arn}/${var.environment}/terraform.tfstate"
    ]
  }

  statement {
    sid = "ListState"
    actions = [
      "s3:ListBucket"
    ]
    resources = [
      var.state_bucket_arn
    ]
  }

  statement {
    sid = "Dynamodb"
    actions = [
      "dynamodb:Describe*",
      "dynamodb:List*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:dynamodb:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}"
    ]
  }

  statement {
    sid = "CognitoIdp"
    actions = [
      "cognito-idp:List*",
      "cognito-idp:Describe*",
      "cognito-idp:Get*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:cognito-idp:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:userpool/*",
    ]
  }

  statement {
    sid = "CognitoIdpGlobal"
    actions = [
      "cognito-idp:DescribeUserPoolDomain",
    ]
    resources = [
      "*"
    ]
  }

  statement {
    sid = "CognitoIdentity"
    actions = [
      "cognito-identity:List*",
      "cognito-identity:Describe*",
      "cognito-identity:Get*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:cognito-identity:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:identitypool/*",
    ]
  }

  statement {
    actions = [
      "iam:GetRole",
      "iam:List*",
      "iam:GetPolicy*"
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:iam::${data.aws_caller_identity.current.account_id}:role/${local.prefix}-*",
      "arn:${data.aws_partition.current.id}:iam::${data.aws_caller_identity.current.account_id}:policy/${local.prefix}-*",
    ]
  }
}

data "aws_iam_policy_document" "rw" {
  statement {
    sid = "WriteState"
    actions = [
      "s3:PutObject"
    ]
    resources = [
      "${var.state_bucket_arn}/${var.environment}/terraform.tfstate"
    ]
  }

  statement {
    sid    = "DynamodbNoItem"
    effect = "Deny"
    actions = [
      "dynamodb:DeleteItem",
      "dynamodb:UpdateItem",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:dynamodb:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}"
    ]
  }

  statement {
    sid = "Dynamodb"
    actions = [
      "dynamodb:Create*",
      "dynamodb:Delete*",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:Update*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:dynamodb:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}"
    ]
  }

  statement {
    sid = "CognitoIdp"
    actions = [
      "cognito-idp:Create*",
      "cognito-idp:TagResource",
      "cognito-idp:UntagResource",
      "cognito-idp:Delete*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:cognito-idp:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:userpool/*",
    ]
  }

  statement {
    sid = "CognitoIdentity"
    actions = [
      "cognito-identity:Update*",
      "cognito-identity:Delete*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:cognito-identity:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:identitypool/*",
    ]
  }

  statement {
    sid = "CognitoIdentityGlobal"
    actions = [
      "cognito-identity:CreateIdentityPool",
      "cognito-identity:SetIdentityPoolRoles",
      "cognito-identity:TagResource",
      "cognito-identity:UntagResource",
    ]
    resources = [
      "*"
    ]
  }

  statement {
    actions = [
      "iam:CreateRole",
      "iam:CreatePolicy",
      "iam:DeleteRole",
      "iam:DeletePolicy",
      "iam:TagRole",
      "iam:TagPolicy",
      "iam:PassRole",
      "iam:Attach*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:iam::${data.aws_caller_identity.current.account_id}:role/${local.prefix}-*",
      "arn:${data.aws_partition.current.id}:iam::${data.aws_caller_identity.current.account_id}:policy/${local.prefix}-*",
    ]
  }
}

data "aws_iam_policy_document" "rw_boundary" {
  statement {
    sid = "s3"
    actions = [
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = [
      "${var.state_bucket_arn}/${var.environment}/terraform.tfstate",
      "arn:${data.aws_partition.current.id}:s3:::${lower(var.app_name)}-${var.environment}-*/*"
    ]
  }

  statement {
    sid = "ListState"
    actions = [
      "s3:ListBucket"
    ]
    resources = [
      "${var.state_bucket_arn}/${var.environment}/terraform.tfstate",
      "arn:${data.aws_partition.current.id}:s3:::${lower(var.app_name)}-${var.environment}-*/*"
    ]
  }

  statement {
    sid = "Dynamodb"
    actions = [
      "dynamodb:Describe*",
      "dynamodb:Create*",
      "dynamodb:Delete*",
      "dynamodb:Batch*",
      "dynamodb:Get*",
      "dynamodb:Query",
      "dynamodb:Delete*",
      "dynamodb:Update*",
      "dynamodb:Put*",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:List*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:dynamodb:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}"
    ]
  }

  statement {
    sid = "CognitoIdp"
    actions = [
      "cognito-idp:Create*",
      "cognito-idp:TagResource",
      "cognito-idp:UntagResource",
      "cognito-idp:List*",
      "cognito-idp:Describe*",
      "cognito-idp:Get*",
      "cognito-idp:Delete*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:cognito-idp:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:userpool/*",
    ]
  }

  statement {
    sid = "CognitoIdpGlobal"
    actions = [
      "cognito-idp:DescribeUserPoolDomain",
    ]
    resources = [
      "*"
    ]
  }

  statement {
    sid = "CognitoIdentity"
    actions = [
      "cognito-identity:List*",
      "cognito-identity:Describe*",
      "cognito-identity:Get*",
      "cognito-identity:Update*",
      "cognito-identity:Delete*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:cognito-identity:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:identitypool/*",
    ]
  }

  statement {
    sid = "CognitoIdentityGlobal"
    actions = [
      "cognito-identity:CreateIdentityPool",
      "cognito-identity:SetIdentityPoolRoles",
      "cognito-identity:TagResource",
      "cognito-identity:UntagResource",
    ]
    resources = [
      "*"
    ]
  }

  statement {
    actions = [
      "iam:CreateRole",
      "iam:CreatePolicy",
      "iam:DeleteRole",
      "iam:DeletePolicy",
      "iam:TagRole",
      "iam:TagPolicy",
      "iam:GetRole",
      "iam:List*",
      "iam:GetPolicy*",
      "iam:PassRole",
      "iam:Attach*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:iam::${data.aws_caller_identity.current.account_id}:role/${local.prefix}-*",
      "arn:${data.aws_partition.current.id}:iam::${data.aws_caller_identity.current.account_id}:policy/${local.prefix}-*",
    ]
  }
}
