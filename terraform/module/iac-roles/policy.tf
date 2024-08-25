data "aws_iam_policy_document" "ro" {
  statement {
    sid = "ReadState"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "${var.state_bucket_arn}/${var.environment}/terraform.tfstate",
    ]
  }

  statement {
    sid = "ListState"
    actions = [
      "s3:ListBucket",
      "s3:GetBucket*",
      "s3:Get*Configuration",
    ]
    resources = [
      var.state_bucket_arn,
      "arn:${data.aws_partition.current.id}:s3:::${lower(var.app_name)}-${var.environment}-ui",
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
    sid = "Global"
    actions = [
      "cognito-idp:DescribeUserPoolDomain",
      "wafv2:GetWebACLForResource",
      "wafv2:GetWebAcl",
      "appsync:GetResolver",
      "cloudfront:List*",
      "cloudfront:Get*Policy",
      "cloudfront:GetDistribution",
      "cloudfront:GetOriginAccessControl",
      "iam:SimulatePrincipalPolicy",
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

  statement {
    actions = [
      "appsync:GetGraphqlApi",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:appsync:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Name"
      values   = [local.prefix]
    }
  }
  statement {
    actions = [
      "appsync:GetSchemaCreationStatus",
      "appsync:GetDataSource",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:appsync:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
    ]
  }

  statement {
    actions = [
      "logs:DescribeLogGroups",
      "logs:ListTagsForResource",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:*"
    ]
  }

  statement {
    actions = [
      "wafv2:ListWebACLs",
      "wafv2:ListTagsForResource",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Name"
      values   = [local.prefix]
    }
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
      "s3:Put*Configuration",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:dynamodb:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}",
      "arn:${data.aws_partition.current.id}:s3:::${lower(local.prefix)}-*",
    ]
  }

  statement {
    sid = "CognitoIdp"
    actions = [
      "cognito-idp:Create*",
      "cognito-idp:TagResource",
      "cognito-idp:UntagResource",
      "cognito-idp:Delete*",
      "cognito-idp:Update*",
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
    sid = "Global"
    actions = [
      "cognito-identity:CreateIdentityPool",
      "cognito-identity:SetIdentityPoolRoles",
      "cognito-identity:TagResource",
      "cognito-identity:UntagResource",
      "appsync:CreateResolver",
      "appsync:DeleteResolver",
      "appsync:UpdateResolver",
      "appsync:SetWebACL",
      "s3:CreateBucket",
      "cloudfront:CreateOriginAccessControl",
      "cloudfront:DeleteOriginAccessControl",
      "cloudfront:CreateDistribution*",
      "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution",
      "cloudfront:TagResource",
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

  statement {
    actions = [
      "appsync:CreateGraphqlApi",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:appsync:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/Name"
      values   = [local.prefix]
    }
  }

  statement {
    actions = [
      "appsync:StartSchemaCreation",
      "appsync:CreateDataSource",
      "appsync:DeleteDataSource",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:appsync:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
    ]
  }

  statement {
    actions = [
      "appsync:UpdateGraphqlApi",
      "appsync:DeleteGraphqlApi",
      "appsync:TagResource",
      "appsync:UntagResource",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:appsync:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*",
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Name"
      values   = [local.prefix]
    }
  }

  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:TagResource",
      "logs:UntagResource",
      "logs:PutRetentionPolicy",
      "s3:DeleteBucket",
      "s3:PutBucket*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:*",
      "arn:${data.aws_partition.current.id}:s3:::${lower(local.prefix)}-*",
    ]
  }

  statement {
    actions   = ["iam:CreateServiceLinkedRole"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"
      values   = ["appsync.${data.aws_partition.current.dns_suffix}"]
    }
  }

  statement {
    actions = [
      "wafv2:CreateWebAcl",
      "wafv2:TagResource",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/Name"
      values   = [local.prefix]
    }
  }

  statement {
    actions = [
      "wafv2:CreateWebACL",
      "wafv2:UpdateWebACL",
    ]
    resources = [
      "arn:aws:wafv2:ap-southeast-2:021891603679:regional/managedruleset/*/*",
      "arn:aws:wafv2:ap-southeast-2:021891603679:regional/webacl/*/*",
    ]
  }

  statement {
    actions = [
      "wafv2:DeleteWebACL",
      "wafv2:ListTagsForResource",
      "wafv2:AssociateWebACL",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Name"
      values   = [local.prefix]
    }
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
      "arn:${data.aws_partition.current.id}:s3:::${lower(var.app_name)}-${var.environment}-*/*",
    ]
  }

  statement {
    sid = "ListState"
    actions = [
      "s3:ListBucket",
      "s3:GetBucket*",
      "s3:Get*Configuration",
      "s3:Put*Configuration",
    ]
    resources = [
      "${var.state_bucket_arn}/${var.environment}/terraform.tfstate",
      "arn:${data.aws_partition.current.id}:s3:::${lower(var.app_name)}-${var.environment}-*",
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
      "cognito-idp:Update*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:cognito-idp:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:userpool/*",
    ]
  }

  statement {
    actions = [
      "cognito-idp:DescribeUserPoolDomain",
      "appsync:SetWebACL",
      "wafv2:GetWebACLForResource",
      "wafv2:GetWebAcl",
      "appsync:CreateResolver",
      "appsync:DeleteResolver",
      "appsync:UpdateResolver",
      "appsync:GetResolver",
      "s3:CreateBucket",
      "cloudfront:List*",
      "cloudfront:Get*Policy",
      "cloudfront:CreateOriginAccessControl",
      "cloudfront:GetOriginAccessControl",
      "cloudfront:DeleteOriginAccessControl",
      "cloudfront:CreateDistribution*",
      "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution",
      "cloudfront:TagResource",
      "cloudfront:GetDistribution",
      "iam:SimulatePrincipalPolicy",
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

  statement {
    actions = [
      "appsync:CreateGraphqlApi",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:appsync:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/Name"
      values   = [local.prefix]
    }
  }

  statement {
    actions = [
      "appsync:StartSchemaCreation",
      "appsync:GetSchemaCreationStatus",
      "appsync:CreateDataSource",
      "appsync:DeleteDataSource",
      "appsync:GetDataSource",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:appsync:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
    ]
  }

  statement {
    actions = [
      "appsync:StartSchemaCreation",
      "appsync:UpdateGraphqlApi",
      "appsync:DeleteGraphqlApi",
      "appsync:TagResource",
      "appsync:UntagResource",
      "appsync:GetGraphqlApi",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:appsync:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*",
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Name"
      values   = [local.prefix]
    }
  }

  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:TagResource",
      "logs:UntagResource",
      "logs:PutRetentionPolicy",
      "logs:DescribeLogGroups",
      "logs:ListTagsForResource",
      "s3:DeleteBucket",
      "s3:PutBucket*",
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:*",
      "arn:${data.aws_partition.current.id}:s3:::${lower(local.prefix)}-*",
    ]
  }

  statement {
    actions   = ["iam:CreateServiceLinkedRole"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"
      values   = ["appsync.${data.aws_partition.current.dns_suffix}"]
    }
  }

  statement {
    actions = [
      "wafv2:CreateWebAcl",
      "wafv2:TagResource",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/Name"
      values   = [local.prefix]
    }
  }

  statement {
    actions = [
      "wafv2:CreateWebACL",
      "wafv2:UpdateWebACL",
    ]
    resources = [
      "arn:aws:wafv2:ap-southeast-2:021891603679:regional/managedruleset/*/*",
      "arn:aws:wafv2:ap-southeast-2:021891603679:regional/webacl/*/*",
    ]
  }

  statement {
    actions = [
      "wafv2:DeleteWebACL",
      "wafv2:UpdatebACL",
      "wafv2:ListTagsForResource",
      "wafv2:AssociateWebACL",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Name"
      values   = [local.prefix]
    }
  }

  statement {
    actions = [
      "wafv2:ListWebACLs",
      "wafv2:ListTagsForResource",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Name"
      values   = [local.prefix]
    }
  }
}
