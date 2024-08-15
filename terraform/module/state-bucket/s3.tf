resource "aws_s3_bucket" "state" {
  # checkov:skip=CKV_AWS_18:Access logging is overkill for us
  # checkov:skip=CKV_AWS_144:Cross-Region replication not required
  # checkov:skip=CKV2_AWS_62:Event notifications not required
  # checkov:skip=CKV_AWS_145:AWS Key is sufficient
  bucket        = "terraform-state-${data.aws_caller_identity.current.account_id}"
  force_destroy = false

  tags = {
    Name = "terraform-state-${data.aws_caller_identity.current.account_id}"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "state" {
  bucket     = aws_s3_bucket.state.id
  depends_on = [aws_s3_bucket_versioning.state]

  rule {
    id = "clean"
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    bucket_key_enabled = true
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

output "arn" {
  description = "ARN of the state bucket"
  value       = aws_s3_bucket.state.arn
}
