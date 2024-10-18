resource "aws_appsync_graphql_api" "graphql" {
  name                = var.prefix
  schema              = file("../../../graphql/schema.graphql")
  authentication_type = "AWS_IAM"
  xray_enabled        = true

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.graphql_log.arn
    field_log_level          = var.log_level
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
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
    ]
    resources = [
      aws_dynamodb_table.table.arn,
      "${aws_dynamodb_table.table.arn}/index/*",
    ]
  }
}

resource "aws_iam_role_policy_attachment" "graphql_datasource" {
  role       = aws_iam_role.graphql_datasource.name
  policy_arn = aws_iam_policy.graphql_datasource.arn
}

locals {
  mutations     = distinct([for d in fileset("${path.module}/../../../graphql/mutation", "**") : dirname(d)])
  queries       = distinct([for d in fileset("${path.module}/../../../graphql/query", "**") : dirname(d)])
  subscriptions = distinct([for d in fileset("${path.module}/../../../graphql/subscription", "**") : dirname(d)])
  functions     = distinct([for d in fileset("${path.module}/../../../graphql/function", "**") : dirname(d)])

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

  subscriptions_map = {
    for subscription in local.subscriptions : replace(subscription, "../../../graphql/subscription/", "") => {
      "type" : "Subscription",
      "path" : "../../../graphql/subscription/${subscription}/appsync.js",
      "make" : "graphql/subscription/${subscription}/appsync.js",
      "source" : "../../../graphql/subscription/${subscription}/appsync.ts"
    }
  }

  functions_map = {
    for function in local.functions : replace(function, "../../../graphql/function/", "") => {
      "type" : "Function",
      "path" : "../../../graphql/function/${function}/appsync.js",
      "make" : "graphql/function/${function}/appsync.js",
      "source" : "../../../graphql/function/${function}/appsync.ts"
    }
  }

  all       = merge(local.mutations_map, local.queries_map, local.subscriptions_map, local.functions_map)
  resolvers = merge(local.mutations_map, local.queries_map, local.subscriptions_map)

  pipelines_map = {
    joinGame = {
      type : "Mutation",
      functions = ["getGameWithToken", "joinGame"]
    }
    getGame = {
      type : "Query",
      functions = ["checkGameAccess", "getGame"]
    }
    updateGame = {
      type : "Mutation",
      functions = ["checkGameFireflyAccess", "findAllPlayers", "updateGameOnPlayers", "updateGame"]
    }
    deletePlayer = {
      type : "Mutation",
      functions = ["checkPlayerSheetAccessWithFirefly", "findAllSections", "deletePlayer"]
    }
    updatePlayer = {
      type : "Mutation",
      functions = ["checkGameAccess", "updatePlayer"]
    }
    createSection = {
      type : "Mutation",
      functions = ["checkPlayerSheetAccess", "checkShipSheetAccess", "createSection"]
    }
    updateSection = {
      type : "Mutation",
      functions = ["checkGameAccess", "updateSection"]
    }
    deleteSection = {
      type : "Mutation",
      functions = ["checkGameAccess", "deleteSection"]
    }
    createShip = {
      type : "Mutation",
      functions = ["checkGameFireflyAccess", "createShip"]
    }
  }
}

resource "aws_appsync_resolver" "resolver" {
  for_each = local.resolvers

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

resource "aws_appsync_resolver" "pipeline" {
  for_each = local.pipelines_map

  api_id            = aws_appsync_graphql_api.graphql.id
  type              = each.value.type
  field             = each.key
  kind              = "PIPELINE"
  request_template  = "{}"
  response_template = "$util.toJson($ctx.result)"

  pipeline_config {
    functions = [for f in each.value.functions : aws_appsync_function.function[f].function_id]
  }
}

resource "aws_appsync_function" "function" {
  for_each = local.functions_map

  api_id      = aws_appsync_graphql_api.graphql.id
  data_source = aws_appsync_datasource.graphql.name
  name        = each.key

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = data.local_file.graphql_code[each.key].content
}

data "local_file" "graphql_code" {
  for_each = local.all

  # For dev, the makefile will rebuild this before calling terraform
  # In pipelines, a previous step will do the build
  filename = each.value.path
}

# nosemgrep: aws-cloudwatch-log-group-unencrypted // AWS Key is fine
resource "aws_cloudwatch_log_group" "api" {
  # checkov:skip=CKV_AWS_338:Two weeks is enough, we don't need a year
  # checkov:skip=CKV_AWS_158:AWS Key is fine
  name              = "/aws/appsync/apis/${aws_appsync_graphql_api.graphql.id}"
  retention_in_days = 14
}
