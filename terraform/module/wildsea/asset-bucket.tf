locals {
  assets      = "${var.prefix}-assets"
  assets_logs = "${var.prefix}-logs"
}

# S3 bucket for storing access logs
resource "aws_s3_bucket" "assets_logs" {
  # checkov:skip=CKV2_AWS_62:No need for S3 events on log bucket
  # checkov:skip=CKV_AWS_144:No need for cross-region replication
  # checkov:skip=CKV_AWS_145:AWS key is sufficient
  # checkov:skip=CKV_AWS_18:Log bucket doesn't need its own logging
  bucket = lower(local.assets_logs)

  tags = {
    Name = local.assets_logs
  }
}

resource "aws_s3_bucket_public_access_block" "assets_logs" {
  bucket = aws_s3_bucket.assets_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "assets_logs" {
  bucket = aws_s3_bucket.assets_logs.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets_logs" {
  bucket = aws_s3_bucket.assets_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# HTTPS-only access policy for assets logs bucket
resource "aws_s3_bucket_policy" "assets_logs" {
  bucket = aws_s3_bucket.assets_logs.id
  policy = data.aws_iam_policy_document.assets_logs.json
}

data "aws_iam_policy_document" "assets_logs" {
  # Block all HTTP Access
  statement {
    sid     = "BlockHTTP"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.assets_logs.arn,
      "${aws_s3_bucket.assets_logs.arn}/*",
    ]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Allow S3 logging service to write logs
  statement {
    sid    = "S3ServerAccessLogsPolicy"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["logging.s3.${data.aws_partition.current.dns_suffix}"]
    }
    actions = [
      "s3:PutObject"
    ]
    resources = ["${aws_s3_bucket.assets_logs.arn}/*"]
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values = [
        aws_s3_bucket.assets.arn,
        aws_s3_bucket.ui.arn
      ]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

# Versioning for log bucket (security best practice)
resource "aws_s3_bucket_versioning" "assets_logs" {
  bucket = aws_s3_bucket.assets_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle policy for log retention
resource "aws_s3_bucket_lifecycle_configuration" "assets_logs" {
  bucket = aws_s3_bucket.assets_logs.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    # Clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket" "assets" {
  # checkov:skip=CKV_AWS_144:No need for cross-region replication
  # checkov:skip=CKV_AWS_145:AWS key is sufficient
  bucket = lower(local.assets)

  tags = {
    Name = local.assets
  }
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.assets.id
  policy = data.aws_iam_policy_document.assets.json
}

data "aws_iam_policy_document" "assets" {
  # Block all HTTP Access
  statement {
    sid     = "BlockHTTP"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.assets.arn,
      "${aws_s3_bucket.assets.arn}/*",
    ]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }


  # Deny uploads with public ACLs
  statement {
    sid    = "DenyPublicACLs"
    effect = "Deny"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]
    resources = ["${aws_s3_bucket.assets.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values = [
        "public-read",
        "public-read-write",
        "authenticated-read"
      ]
    }
  }

}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true # Cost optimization
  }
}

# CORS configuration for direct uploads from both production and development
resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["POST", "PUT"]
    allowed_origins = [
      "https://${local.cdn_domain_name}",
      "http://localhost:5173",
      "http://localhost:5174"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Basic lifecycle to handle incomplete uploads
# S3 access logging configuration for assets bucket
resource "aws_s3_bucket_logging" "assets" {
  bucket = aws_s3_bucket.assets.id

  target_bucket = aws_s3_bucket.assets_logs.id
  target_prefix = "assets-access-logs/"
}

# S3 access logging configuration for UI bucket
resource "aws_s3_bucket_logging" "ui" {
  bucket = aws_s3_bucket.ui.id

  target_bucket = aws_s3_bucket.assets_logs.id
  target_prefix = "ui-access-logs/"
}

resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "cleanup-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 3
    }

    noncurrent_version_expiration {
      newer_noncurrent_versions = 5
      noncurrent_days           = 30
    }

    expiration {
      expired_object_delete_marker = true
    }
  }
}

# SQS queue for S3 asset upload events
resource "aws_sqs_queue" "asset_uploads" {
  name = "${var.prefix}-asset-uploads"

  # Message retention for 1 hour (enough for processing)
  message_retention_seconds = 3600

  # Visibility timeout should be longer than lambda timeout
  visibility_timeout_seconds = 60

  tags = {
    Application = var.prefix
  }
}

# SQS queue policy to allow S3 to send messages
resource "aws_sqs_queue_policy" "asset_uploads" {
  queue_url = aws_sqs_queue.asset_uploads.id
  policy    = data.aws_iam_policy_document.asset_uploads_queue.json
}

data "aws_iam_policy_document" "asset_uploads_queue" {
  statement {
    sid    = "AllowS3ToSendMessages"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }

    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.asset_uploads.arn]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_s3_bucket.assets.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

# S3 event notification to SQS (instead of EventBridge)
resource "aws_s3_bucket_notification" "assets_events" {
  bucket = aws_s3_bucket.assets.id

  queue {
    queue_arn = aws_sqs_queue.asset_uploads.arn
    events    = ["s3:ObjectCreated:*"]

    filter_suffix = "/original"
  }
}

# EventBridge pipe to move events from SQS to our custom bus
resource "aws_pipes_pipe" "asset_uploads_pipe" {
  name     = "${var.prefix}-asset-uploads"
  role_arn = aws_iam_role.asset_uploads_pipe.arn
  source   = aws_sqs_queue.asset_uploads.arn
  target   = aws_cloudwatch_event_bus.bus.arn

  source_parameters {
    sqs_queue_parameters {
      batch_size = 1
    }
  }

  # Step Function enrichment to extract gameId, sectionId, assetId from S3 object key
  enrichment = aws_sfn_state_machine.asset_path_parser.arn

  target_parameters {
    eventbridge_event_bus_parameters {
      detail_type = local.finalise_asset_detail_type
      source      = local.finalise_asset_source
    }
  }

  log_configuration {
    level = "ERROR"
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.asset_uploads_pipe.arn
    }
  }

  tags = {
    Application = var.prefix
  }
}

resource "aws_cloudwatch_log_group" "asset_uploads_pipe" {
  name              = "/aws/vendedlogs/pipes/${var.prefix}-asset-uploads"
  retention_in_days = 30

  tags = {
    Application = var.prefix
  }
}

resource "aws_cloudwatch_log_group" "asset_path_parser" {
  name              = "/aws/vendedlogs/states/${var.prefix}-asset-path-parser"
  retention_in_days = 30

  tags = {
    Application = var.prefix
  }
}

# Step Function for parsing S3 object paths in EventBridge pipe enrichment
resource "aws_sfn_state_machine" "asset_path_parser" {
  name     = "${var.prefix}-asset-path-parser"
  role_arn = aws_iam_role.asset_path_parser.arn
  type     = "EXPRESS"

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.asset_path_parser.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tracing_configuration {
    enabled = true
  }

  definition = jsonencode({
    Comment       = "Extract gameId, sectionId, assetId from S3 object key using JSONata"
    StartAt       = "ParseS3Path"
    QueryLanguage = "JSONata"
    States = {
      ParseS3Path = {
        Type = "Pass"
        Output = {
          gameId : "{% ($parse($states.input[0].body).Records[0].s3.object.key ~> $split('/'))[2] %}"
          sectionId : "{% ($parse($states.input[0].body).Records[0].s3.object.key ~> $split('/'))[4] %}"
          assetId : "{% ($parse($states.input[0].body).Records[0].s3.object.key ~> $split('/'))[5] %}"
          bucket : "{% $parse($states.input[0].body).Records[0].s3.bucket.name %}"
          key : "{% $parse($states.input[0].body).Records[0].s3.object.key %}"
          eventName : "{% $parse($states.input[0].body).Records[0].eventName %}"
        }
        End = true
      }
    }
  })

  tags = {
    Application = var.prefix
  }

  depends_on = [aws_iam_role_policy.asset_path_parser]
}

# IAM role for the Step Function
resource "aws_iam_role" "asset_path_parser" {
  name               = "${var.prefix}-asset-path-parser"
  assume_role_policy = data.aws_iam_policy_document.asset_path_parser_sfn_assume.json

  tags = {
    Application = var.prefix
  }
}

data "aws_iam_policy_document" "asset_path_parser_sfn_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# IAM policy for the Step Function role to write logs
resource "aws_iam_role_policy" "asset_path_parser" {
  name   = "${var.prefix}-asset-path-parser"
  role   = aws_iam_role.asset_path_parser.id
  policy = data.aws_iam_policy_document.asset_path_parser.json
}

data "aws_iam_policy_document" "asset_path_parser" {
  # Allow writing to CloudWatch Logs
  statement {
    effect = "Allow"
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
    resources = [
      "*", # WTF, AWS?!
      #"${aws_cloudwatch_log_group.asset_path_parser.arn}:*",
      #aws_cloudwatch_log_group.asset_path_parser.arn,
    ]
  }

  # Allow X-Ray tracing
  statement {
    effect = "Allow"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords"
    ]
    resources = ["*"]
  }
}

# IAM role for the EventBridge pipe
resource "aws_iam_role" "asset_uploads_pipe" {
  name               = "${var.prefix}-asset-uploads-pipe"
  assume_role_policy = data.aws_iam_policy_document.asset_uploads_pipe_assume.json

  tags = {
    Application = var.prefix
  }
}

data "aws_iam_policy_document" "asset_uploads_pipe_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["pipes.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# IAM policy for the EventBridge pipe
resource "aws_iam_role_policy" "asset_uploads_pipe" {
  name   = "${var.prefix}-asset-uploads-pipe"
  role   = aws_iam_role.asset_uploads_pipe.id
  policy = data.aws_iam_policy_document.asset_uploads_pipe.json
}

data "aws_iam_policy_document" "asset_uploads_pipe" {
  # Allow reading from SQS queue
  statement {
    effect = "Allow"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]
    resources = [aws_sqs_queue.asset_uploads.arn]
  }

  # Allow invoking Step Function for enrichment
  statement {
    effect = "Allow"
    actions = [
      "states:StartSyncExecution"
    ]
    resources = [aws_sfn_state_machine.asset_path_parser.arn]
  }

  # Allow sending events to our EventBridge bus
  statement {
    effect = "Allow"
    actions = [
      "events:PutEvents"
    ]
    resources = [aws_cloudwatch_event_bus.bus.arn]
  }

  # Allow writing to CloudWatch Logs
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.asset_uploads_pipe.arn}:*",
    ]
  }
}