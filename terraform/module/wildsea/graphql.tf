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
  count = var.enable_waf ? 1 : 0

  resource_arn = aws_appsync_graphql_api.graphql.arn
  web_acl_arn  = aws_wafv2_web_acl.graphql[0].arn
}

resource "aws_wafv2_web_acl" "graphql" {
  # checkov:skip=CKV2_AWS_31:Full logging could be too expensive
  count = var.enable_waf ? 1 : 0

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
      cloudwatch_metrics_enabled = true
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
      none {}
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = false
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
      none {}
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesAmazonIpReputationList"
      sampled_requests_enabled   = false
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 40
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    override_action {
      none {}
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = false
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

resource "aws_appsync_datasource" "graphql" {
  api_id           = aws_appsync_graphql_api.graphql.id
  name             = replace(var.prefix, "-", "_")
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.graphql_datasource.arn
  description      = "DynamoDB Resolver"

  dynamodb_config {
    table_name = aws_dynamodb_table.table.name
    region     = data.aws_region.current.name
  }
}

resource "aws_iam_role" "graphql_datasource" {
  name               = "${var.prefix}-graphql-datasource"
  assume_role_policy = data.aws_iam_policy_document.graphql_datasource_assume.json

  tags = {
    Name = var.prefix
  }
}

data "aws_iam_policy_document" "graphql_datasource_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["appsync.${data.aws_partition.current.dns_suffix}"]
    }
  }
}

resource "aws_iam_policy" "graphql_datasource" {
  name   = "${var.prefix}-graphql-datasource"
  policy = data.aws_iam_policy_document.graphql_datasource.json

  tags = {
    Name = var.prefix
  }
}

data "aws_iam_policy_document" "graphql_datasource" {
  statement {
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateutItem",
      "dynamodb:Query",
    ]
    resources = [aws_dynamodb_table.table.arn]
  }
}

resource "aws_iam_role_policy_attachment" "graphql_datasource" {
  role       = aws_iam_role.graphql_datasource.name
  policy_arn = aws_iam_policy.graphql_datasource.arn
}

locals {
  mutations = distinct([for d in fileset("${path.module}/../../../graphql/mutation", "**") : dirname(d)])
  queries   = distinct([for d in fileset("${path.module}/../../../graphql/query", "**") : dirname(d)])

  mutations_map = {
    for mutation in local.mutations : replace(mutation, "../../../graphql/mutation/", "") => {
      "type" : "Mutation",
      "path" : "../../../graphql/mutation/${mutation}/appsync.js",
      "make" : "graphql/mutation/${mutation}/appsync.js",
      "source" : "../../../graphql/mutation/${mutation}/appsync.ts"
    }
  }

  queries_map = {
    for query in local.queries : replace(query, "../../../graphql/query/", "") => {
      "type" : "Query",
      "path" : "../../../graphql/query/${query}/appsync.js",
      "make" : "graphql/query/${query}/appsync.js",
      "source" : "../../../graphql/query/${query}/appsync.ts"
    }
  }

  all = merge(local.mutations_map, local.queries_map)
}

resource "aws_appsync_resolver" "resolver" {
  for_each = local.all

  api_id      = aws_appsync_graphql_api.graphql.id
  type        = each.value.type
  field       = each.key
  data_source = aws_appsync_datasource.graphql.name
  code        = data.local_file.graphql_code[each.key].content

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

resource "null_resource" "graphql_compile" {
  for_each = local.all

  provisioner "local-exec" {
    command = "cd ${path.module}/../../.. && make ${each.value.make}"
  }

  triggers = {
    source_change = filesha256(each.value.source)
    dest_file     = each.value.path
  }
}

data "local_file" "graphql_code" {
  for_each = local.all

  filename = null_resource.graphql_compile[each.key].triggers.dest_file
}
