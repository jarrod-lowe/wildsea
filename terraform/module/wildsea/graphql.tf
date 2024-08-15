resource "aws_appsync_graphql_api" "graphql" {
  name                = var.prefix
  schema              = file("../../../graphql/schema.graphql")
  authentication_type = "AWS_IAM"
  xray_enabled        = true

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.graphql_log.arn
    field_log_level          = "ERROR"
  }

  additional_authentication_provider {
    authentication_type = "AMAZON_COGNITO_USER_POOLS"
    user_pool_config {
      user_pool_id = aws_cognito_user_pool.cognito.id
      aws_region   = data.aws_region.current.name
    }
  }

  tags = {
    Name = var.prefix
  }
}

# nosemgrep: aws-cloudwatch-log-group-unencrypted // AWS Key is fine
resource "aws_cloudwatch_log_group" "graphql_log" {
  # checkov:skip=CKV_AWS_338:Two weeks is enough, we don't need a year
  # checkov:skip=CKV_AWS_158:AWS Key is fine
  name              = "/aws/appsync/${var.prefix}"
  retention_in_days = 14

  tags = {
    Name = var.prefix
  }
}

resource "aws_iam_role" "graphql_log" {
  name               = "${var.prefix}-graphql-log"
  assume_role_policy = data.aws_iam_policy_document.graphql_log_assume.json

  tags = {
    Name = var.prefix
  }
}

data "aws_iam_policy_document" "graphql_log_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["appsync.${data.aws_partition.current.dns_suffix}"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "grahql_log" {
  role       = aws_iam_role.graphql_log.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
}

resource "aws_wafv2_web_acl_association" "graphql" {
  resource_arn = aws_appsync_graphql_api.graphql.arn
  web_acl_arn  = aws_wafv2_web_acl.graphql.arn
}

resource "aws_wafv2_web_acl" "graphql" {
  name  = "${var.prefix}-graphql-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "Ratelimit"
    priority = 10

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"

      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "Ratelimit"
      sampled_requests_enabled   = false
    }
  }


  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 20
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    override_action {
      count {

      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 30
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }
    override_action {
      count {

      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesAmazonIpReputationList"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "GraphQLWAF"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = var.prefix
  }
}
