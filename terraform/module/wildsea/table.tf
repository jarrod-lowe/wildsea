# nosemgrep: aws-dynamodb-table-unencrypted // AWS Key is fine
resource "aws_dynamodb_table" "table" {
  # checkov:skip=CKV_AWS_119:AWS Key is fine
  name                        = var.prefix
  billing_mode                = "PAY_PER_REQUEST"
  deletion_protection_enabled = true
  hash_key                    = "PK"
  range_key                   = "SK"
  stream_enabled              = true
  stream_view_type            = "OLD_IMAGE"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "PK"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = var.prefix
  }
}
