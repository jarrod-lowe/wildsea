# Lambda function for generating S3 presigned URLs
resource "aws_lambda_function" "generate_presigned_url" {
  filename      = data.archive_file.generate_presigned_url_zip.output_path
  function_name = "${var.prefix}-generate-presigned-url"
  role          = aws_iam_role.lambda_generate_presigned_url.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30 # LAMBDA_TIMEOUT_SECONDS

  source_code_hash = data.archive_file.generate_presigned_url_zip.output_base64sha256

  tags = {
    Name = "${var.prefix}-generate-presigned-url"
  }
}

# ZIP the Lambda code
data "archive_file" "generate_presigned_url_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../lambda/generatePresignedUrl"
  output_path = "${path.module}/../../../lambda/generatePresignedUrl.zip"
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_generate_presigned_url" {
  name               = "${var.prefix}-lambda-generate-presigned-url"
  assume_role_policy = data.aws_iam_policy_document.lambda_generate_presigned_url_assume.json

  tags = {
    Name = "${var.prefix}-lambda-generate-presigned-url"
  }
}

# Lambda assume role policy
data "aws_iam_policy_document" "lambda_generate_presigned_url_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# IAM policy for Lambda
resource "aws_iam_role_policy" "lambda_generate_presigned_url" {
  name   = "${var.prefix}-lambda-generate-presigned-url"
  role   = aws_iam_role.lambda_generate_presigned_url.id
  policy = data.aws_iam_policy_document.lambda_generate_presigned_url.json
}

# Lambda execution policy
data "aws_iam_policy_document" "lambda_generate_presigned_url" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject"
    ]
    resources = ["${aws_s3_bucket.assets.arn}/*"]
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_generate_presigned_url" {
  name              = "/aws/lambda/${aws_lambda_function.generate_presigned_url.function_name}"
  retention_in_days = 14

  tags = {
    Name = "${var.prefix}-lambda-generate-presigned-url"
  }
}