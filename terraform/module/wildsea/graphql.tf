resource "aws_appsync_graphql_api" "graphql" {
    name = var.prefix
    schema = file("../../../graphql/schema.graphql")
    authentication_type = "AWS_IAM"
    xray_enabled = true

    log_config {
      cloudwatch_logs_role_arn = aws_iam_role.graphql_log.arn
      field_log_level = "ERROR"
    }

    additional_authentication_provider {
      authentication_type = "AMAZON_COGNITO_USER_POOLS"
      user_pool_config {
        user_pool_id = aws_cognito_user_pool.cognito.id
        aws_region = data.aws_region.current.name
      }
    }

  tags = {
    Name = var.prefix
  }
}

resource "aws_cloudwatch_log_group" "graphql_log" {
  name = "/aws/appsync/${var.prefix}"
  retention_in_days = 14

  tags = {
    Name = var.prefix
  }
}

resource "aws_iam_role" "graphql_log" {
    name = "${var.prefix}-graphql-log"
    assume_role_policy = data.aws_iam_policy_document.graphql_log_assume.json

    tags = {
      Name = var.prefix
    }
}

data "aws_iam_policy_document" "graphql_log_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["appsync.${data.aws_partition.current.dns_suffix}"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "grahql_log" {
    role = aws_iam_role.graphql_log.name
    policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
}
