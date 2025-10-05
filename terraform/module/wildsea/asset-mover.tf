# Asset mover infrastructure
# DynamoDB Stream -> Pipe -> Step Function to move assets from incoming/ to asset/

resource "aws_cloudwatch_log_group" "move_asset_pipe" {
  # checkov:skip=CKV_AWS_158:AWS-managed keys are sufficient for pipe logs
  # checkov:skip=CKV_AWS_338:30-day retention is sufficient for pipe logs
  # nosemgrep: aws-cloudwatch-log-group-aws-managed-key
  name              = "/aws/vendedlogs/pipes/${var.prefix}-move-asset"
  retention_in_days = 30

  tags = {
    Application = var.prefix
  }
}

resource "aws_iam_role" "move_asset_pipe" {
  name               = "${var.prefix}-move-asset-pipe"
  assume_role_policy = data.aws_iam_policy_document.move_asset_pipe_assume.json
}

data "aws_iam_policy_document" "move_asset_pipe_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["pipes.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "move_asset_pipe" {
  name   = "${var.prefix}-move-asset-pipe"
  policy = data.aws_iam_policy_document.move_asset_pipe.json
}

data "aws_iam_policy_document" "move_asset_pipe" {
  statement {
    sid = "ReadStream"
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams",
    ]
    resources = [
      aws_dynamodb_table.table.stream_arn,
    ]
  }

  statement {
    sid = "InvokeStepFunction"
    actions = [
      "states:StartExecution"
    ]
    resources = [
      aws_sfn_state_machine.move_asset_sm.arn
    ]
  }

  statement {
    sid = "WriteLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.move_asset_pipe.arn}:*",
    ]
  }
}

resource "aws_iam_role_policy_attachment" "move_asset_pipe" {
  role       = aws_iam_role.move_asset_pipe.name
  policy_arn = aws_iam_policy.move_asset_pipe.arn
}

resource "aws_pipes_pipe" "move_asset_pipe" {
  name     = "${var.prefix}-move-asset"
  role_arn = aws_iam_role.move_asset_pipe.arn
  source   = aws_dynamodb_table.table.stream_arn
  target   = aws_sfn_state_machine.move_asset_sm.arn
  source_parameters {
    dynamodb_stream_parameters {
      batch_size                         = 1
      starting_position                  = "LATEST"
      maximum_record_age_in_seconds      = 60
      maximum_batching_window_in_seconds = 3
      maximum_retry_attempts             = 3
    }
    filter_criteria {
      filter {
        pattern = jsonencode({
          eventName = ["MODIFY"]
          dynamodb = {
            NewImage = {
              type = {
                S = ["ASSET"]
              }
              status = {
                S = ["FINALISING"]
              }
            }
          }
        })
      }
    }
  }
  target_parameters {
    step_function_state_machine_parameters {
      invocation_type = "FIRE_AND_FORGET"
    }
  }
  log_configuration {
    level = "ERROR"
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.move_asset_pipe.arn
    }
  }
}

resource "aws_cloudwatch_log_group" "move_asset_sm" {
  # checkov:skip=CKV_AWS_158:AWS-managed keys are sufficient for Step Function logs
  # checkov:skip=CKV_AWS_338:30-day retention is sufficient for Step Function logs
  # nosemgrep: aws-cloudwatch-log-group-aws-managed-key
  name              = "/aws/vendedlogs/states/${var.prefix}-move-asset"
  retention_in_days = 30

  tags = {
    Application = var.prefix
  }
}

resource "aws_iam_role" "move_asset_sm" {
  name               = "${var.prefix}-move-asset"
  assume_role_policy = data.aws_iam_policy_document.move_asset_sm_assume.json
}

data "aws_iam_policy_document" "move_asset_sm_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "move_asset_sm" {
  name   = "${var.prefix}-move-asset"
  policy = data.aws_iam_policy_document.move_asset_sm.json
}

data "aws_iam_policy_document" "move_asset_sm" {
  statement {
    sid = "S3Operations"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = [
      "${aws_s3_bucket.assets.arn}/incoming/*",
      "${aws_s3_bucket.assets.arn}/asset/*"
    ]
  }

  statement {
    sid = "WriteLogs"
    actions = [
      "logs:CreateLogDelivery",
      "logs:CreateLogStream",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutLogEvents",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
      "logs:DescribeLogGroups",
    ]
    resources = ["*"]
  }

  statement {
    sid = "XRayTracing"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy_attachment" "move_asset_sm" {
  role       = aws_iam_role.move_asset_sm.name
  policy_arn = aws_iam_policy.move_asset_sm.arn
}

resource "aws_sfn_state_machine" "move_asset_sm" {
  name     = "${var.prefix}-move-asset"
  role_arn = aws_iam_role.move_asset_sm.arn
  tracing_configuration {
    enabled = true
  }
  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.move_asset_sm.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }
  definition = jsonencode(yamldecode(templatefile(
    "${path.module}/../../../sfn/asset-mover.yaml",
    {
      bucket_name = aws_s3_bucket.assets.bucket
    }
  )))
  depends_on = [
    aws_iam_policy.move_asset_sm,
    aws_iam_role_policy_attachment.move_asset_sm,
  ]
}
