locals {
  ui = "${var.prefix}-ui"
}

resource "aws_s3_bucket" "ui" {
  # checkov:skip=CKV2_AWS_62:No need for S3 events
  # checkov:skip=CKV_AWS_144:No need for cross-region replication
  # checkov:skip=CKV_AWS_145:AWS key is sufficient
  bucket = lower(local.ui)

  tags = {
    Name = local.ui
  }
}

resource "aws_s3_bucket_policy" "ui" {
  bucket = aws_s3_bucket.ui.id
  policy = data.aws_iam_policy_document.ui.json
}

data "aws_iam_policy_document" "ui" {
  statement {
    sid       = "CDNRead"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.ui.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.${data.aws_partition.current.dns_suffix}"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }

  statement {
    sid       = "CDNList"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.ui.arn]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.${data.aws_partition.current.dns_suffix}"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }

  # Block all HTTP Access
  statement {
    sid     = "BlockHTTP"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.ui.arn,
      "${aws_s3_bucket.ui.arn}/*",
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

resource "aws_s3_bucket_public_access_block" "ui" {
  bucket = aws_s3_bucket.ui.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "ui" {
  bucket = aws_s3_bucket.ui.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "ui" {
  bucket = aws_s3_bucket.ui.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ui" {
  bucket = aws_s3_bucket.ui.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Use recommended CORS rules for bucket behind cloudfront
resource "aws_s3_bucket_cors_configuration" "ui" {
  bucket = aws_s3_bucket.ui.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://${aws_cloudfront_distribution.cdn.domain_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lifecycle to:
# * Delete incomplete multipart uploads after 3 days
# * Limit old versions to maximum of 5 or and age of 30 days
# * Keep the current version forever
resource "aws_s3_bucket_lifecycle_configuration" "ui" {
  bucket = aws_s3_bucket.ui.id

  rule {
    id     = "expire-versions"
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
