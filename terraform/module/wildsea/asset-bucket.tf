locals {
  assets      = "${var.prefix}-assets"
  assets_logs = "${var.prefix}-assets-logs"
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
  }
}

resource "aws_s3_bucket" "assets" {
  # checkov:skip=CKV2_AWS_62:No need for S3 events
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
# S3 access logging configuration
resource "aws_s3_bucket_logging" "assets" {
  bucket = aws_s3_bucket.assets.id

  target_bucket = aws_s3_bucket.assets_logs.id
  target_prefix = "access-logs/"
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