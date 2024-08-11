data "aws_iam_policy_document" "ro" {
  statement {
    sid = "ReadState"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "${aws_s3_bucket.state.arn}/${var.environment}/terraform.tfstate"
    ]
  }

  statement {
    sid = "ListState"
    actions = [
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.state.arn
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
}

data "aws_iam_policy_document" "rw" {
  statement {
    sid = "WriteState"
    actions = [
      "s3:PutObject"
    ]
    resources = [
      "${aws_s3_bucket.state.arn}/${var.environment}/terraform.tfstate"
    ]
  }

  statement {
    sid = "DynamodbNoItem"
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
}

data "aws_iam_policy_document" "rw_boundary" {
  statement {
    sid = "s3"
    actions = [
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = [
      "${aws_s3_bucket.state.arn}/${var.environment}/terraform.tfstate",
      "arn:${data.aws_partition.current.id}:s3:::${var.app_name}-${var.environment}-*/*"
    ]
  }

  statement {
    sid = "ListState"
    actions = [
      "s3:ListBucket"
    ]
    resources = [
      "arn:${data.aws_partition.current.id}:s3:::${var.app_name}-${var.environment}-*/*"
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
}
