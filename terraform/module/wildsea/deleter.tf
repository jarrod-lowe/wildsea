// ddb stream -> pipe -> Step function -> bus -> rules to delete left-over players 
locals {
  graphql_hostname = split("/", aws_appsync_graphql_api.graphql.uris["GRAPHQL"])[2]
  graphql_id       = split(".", local.graphql_hostname)[0]
  graphql_ep_arn = join(":", [
    "arn",
    data.aws_partition.current.id,
    "appsync",
    data.aws_region.current.name,
    data.aws_caller_identity.current.account_id,
    join("/", [
      "endpoints",
      "graphql-api",
      local.graphql_id,
    ]),
  ])
  graphql_delete_player_mutation  = <<-EOT
        mutation DeletePlayerBackground($input: DeletePlayerInput!) {
            deletePlayer(input: $input) {
                gameId
                userId
                deleted
            }
        }
    EOT
  graphql_expire_asset_mutation   = <<-EOT
        mutation ExpireAssetBackground($input: ExpireAssetInput!) {
            _expireAsset(input: $input) {
                assetId
                createdAt
                gameId
                height
                label
                mimeType
                sectionId
                sizeBytes
                status
                type
                updatedAt
                width
            }
        }
    EOT
  graphql_finalise_asset_mutation = <<-EOT
        mutation FinaliseAssetBackground($input: FinaliseAssetInput!) {
            _finaliseAsset(input: $input) {
                assetId
                createdAt
                gameId
                height
                label
                mimeType
                sectionId
                sizeBytes
                status
                type
                updatedAt
                width
            }
        }
    EOT
  delete_source                   = "wildsea.table"
  delete_player_detail_type       = "DeletePlayer"
  expire_asset_source             = "wildsea.table"
  expire_asset_detail_type        = "ExpireAsset"
  finalise_asset_source           = "asset.uploaded"
  finalise_asset_detail_type      = "ObjectCreated"
}

resource "aws_cloudwatch_log_group" "delete_player_pipe" {
  # checkov:skip=CKV_AWS_158:AWS-managed keys are sufficient for pipe logs
  # checkov:skip=CKV_AWS_338:30-day retention is sufficient for pipe logs
  # nosemgrep: aws-cloudwatch-log-group-aws-managed-key
  name              = "/aws/vendedlogs/pipes/${var.prefix}-delete"
  retention_in_days = 30

  tags = {
    Application = var.prefix
  }
}

resource "aws_iam_role" "delete_player_pipe" {
  name               = "${var.prefix}-delete-pipe"
  assume_role_policy = data.aws_iam_policy_document.delete_pipe_assume.json
}

data "aws_iam_policy_document" "delete_pipe_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["pipes.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "delete_player_pipe" {
  name   = "${var.prefix}-delete-pipe"
  policy = data.aws_iam_policy_document.delete_player_pipe.json
}

data "aws_iam_policy_document" "delete_player_pipe" {
  statement {
    sid = "ReadStream"
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams",
    ]
    resources = [
      aws_dynamodb_table.table.stream_arn,
    ]
  }

  statement {
    sid = "InvokeStepFunction"
    actions = [
      "states:StartExecution"
    ]
    resources = [
      aws_sfn_state_machine.delete_player_sm.arn
    ]
  }

  statement {
    sid = "WriteLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.delete_player_pipe.arn}:*",
    ]
  }
}

resource "aws_iam_role_policy_attachment" "delete_player_pipe" {
  role       = aws_iam_role.delete_player_pipe.name
  policy_arn = aws_iam_policy.delete_player_pipe.arn
}

resource "aws_pipes_pipe" "delete_player_pipe" {
  name     = "${var.prefix}-delete"
  role_arn = aws_iam_role.delete_player_pipe.arn
  source   = aws_dynamodb_table.table.stream_arn
  target   = aws_sfn_state_machine.delete_player_sm.arn
  source_parameters {
    dynamodb_stream_parameters {
      batch_size                         = 1
      starting_position                  = "LATEST"
      maximum_record_age_in_seconds      = 60
      maximum_batching_window_in_seconds = 3
      maximum_retry_attempts             = 3
    }
    filter_criteria {
      filter {
        pattern = jsonencode({
          eventName = ["REMOVE"]
          dynamodb = {
            Keys = {
              SK = {
                S = ["GAME"]
              }
            }
          }
        })
      }
    }
  }
  target_parameters {
    step_function_state_machine_parameters {
      invocation_type = "FIRE_AND_FORGET"
    }
  }
  log_configuration {
    level = "ERROR"
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.delete_player_pipe.arn
    }
  }
}

resource "aws_iam_role" "delete_player_sm" {
  name               = "${var.prefix}-delete-player"
  assume_role_policy = data.aws_iam_policy_document.delete_sm_assume.json
}

data "aws_iam_policy_document" "delete_sm_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "delete_player_sm" {
  name   = "${var.prefix}-delete-player"
  policy = data.aws_iam_policy_document.delete_player_sm.json
}

data "aws_iam_policy_document" "delete_player_sm" {
  statement {
    sid = "SendToBus"
    actions = [
      "events:PutEvents"
    ]
    resources = [
      aws_cloudwatch_event_bus.bus.arn
    ]
  }

  statement {
    sid = "QueryDynamoDB"
    actions = [
      "dynamodb:Query"
    ]
    resources = [
      aws_dynamodb_table.table.arn,
    ]
  }
}

resource "aws_iam_role_policy_attachment" "delete_player_sm" {
  role       = aws_iam_role.delete_player_sm.name
  policy_arn = aws_iam_policy.delete_player_sm.arn
}

resource "aws_sfn_state_machine" "delete_player_sm" {
  # checkov:skip=CKV_AWS_285: Figure out logging later
  name     = "${var.prefix}-delete-player"
  role_arn = aws_iam_role.delete_player_sm.arn
  tracing_configuration {
    enabled = true
  }
  definition = jsonencode(yamldecode(templatefile(
    "${path.module}/../../../sfn/deleter.yaml",
    {
      bus_arn     = aws_cloudwatch_event_bus.bus.arn
      table_name  = aws_dynamodb_table.table.name
      source      = local.delete_source
      detail_type = local.delete_player_detail_type
    }
  )))
  depends_on = [
    aws_iam_policy.delete_player_sm,
    aws_iam_role_policy_attachment.delete_player_sm,
  ]
}

resource "aws_iam_role" "deleter_bus" {
  name               = "${var.prefix}-deleter-bus"
  assume_role_policy = data.aws_iam_policy_document.deleter_bus_assume.json
}

data "aws_iam_policy_document" "deleter_bus_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "deleter_bus" {
  name   = "${var.prefix}-deleter-bus"
  policy = data.aws_iam_policy_document.deleter_bus.json
}

data "aws_iam_policy_document" "deleter_bus" {
  statement {
    sid = "InvokeGraphQL"
    actions = [
      "appsync:GraphQL",
    ]
    resources = [
      "${aws_appsync_graphql_api.graphql.arn}/types/Mutation/fields/deletePlayer",
    ]
  }
}

resource "aws_iam_role_policy_attachment" "deleter_bus" {
  role       = aws_iam_role.deleter_bus.name
  policy_arn = aws_iam_policy.deleter_bus.arn
}

resource "aws_cloudwatch_event_rule" "delete_rule" {
  name           = "${var.prefix}-delete-player"
  description    = "Delete players on deleted game"
  event_bus_name = aws_cloudwatch_event_bus.bus.name
  state          = "ENABLED"
  event_pattern = jsonencode({
    "source"      = [local.delete_source]
    "detail-type" = [local.delete_player_detail_type]
  })
}

resource "aws_cloudwatch_event_target" "delete_target" {
  target_id      = "appsync-delete-player"
  rule           = aws_cloudwatch_event_rule.delete_rule.name
  arn            = local.graphql_ep_arn
  role_arn       = aws_iam_role.deleter_bus.arn
  event_bus_name = aws_cloudwatch_event_bus.bus.name

  input_transformer {
    input_paths = {
      gameId = "$.detail.gameId"
      userId = "$.detail.userId"
    }
    input_template = <<-EOT
      {
          "input": {
              "gameId": "<gameId>",
              "userId": "<userId>"
          }
      }
    EOT
  }

  appsync_target {
    graphql_operation = local.graphql_delete_player_mutation
  }
}

# Asset expiration infrastructure

resource "aws_cloudwatch_log_group" "expire_asset_pipe" {
  # checkov:skip=CKV_AWS_158:AWS-managed keys are sufficient for pipe logs
  # checkov:skip=CKV_AWS_338:30-day retention is sufficient for pipe logs
  # nosemgrep: aws-cloudwatch-log-group-aws-managed-key
  name              = "/aws/vendedlogs/pipes/${var.prefix}-expire-asset"
  retention_in_days = 30

  tags = {
    Application = var.prefix
  }
}

resource "aws_iam_role" "expire_asset_pipe" {
  name               = "${var.prefix}-expire-asset-pipe"
  assume_role_policy = data.aws_iam_policy_document.expire_asset_pipe_assume.json
}

data "aws_iam_policy_document" "expire_asset_pipe_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["pipes.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "expire_asset_pipe" {
  name   = "${var.prefix}-expire-asset-pipe"
  policy = data.aws_iam_policy_document.expire_asset_pipe.json
}

data "aws_iam_policy_document" "expire_asset_pipe" {
  statement {
    sid = "ReadStream"
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams",
    ]
    resources = [
      aws_dynamodb_table.table.stream_arn,
    ]
  }

  statement {
    sid = "InvokeStepFunction"
    actions = [
      "states:StartExecution"
    ]
    resources = [
      aws_sfn_state_machine.expire_asset_sm.arn
    ]
  }

  statement {
    sid = "WriteLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.expire_asset_pipe.arn}:*",
    ]
  }
}

resource "aws_iam_role_policy_attachment" "expire_asset_pipe" {
  role       = aws_iam_role.expire_asset_pipe.name
  policy_arn = aws_iam_policy.expire_asset_pipe.arn
}

resource "aws_pipes_pipe" "expire_asset_pipe" {
  name     = "${var.prefix}-expire-asset"
  role_arn = aws_iam_role.expire_asset_pipe.arn
  source   = aws_dynamodb_table.table.stream_arn
  target   = aws_sfn_state_machine.expire_asset_sm.arn
  source_parameters {
    dynamodb_stream_parameters {
      batch_size                         = 1
      starting_position                  = "LATEST"
      maximum_record_age_in_seconds      = 60
      maximum_batching_window_in_seconds = 3
      maximum_retry_attempts             = 3
    }
    filter_criteria {
      filter {
        pattern = jsonencode({
          eventName = ["INSERT"]
          dynamodb = {
            NewImage = {
              type = {
                S = ["ASSET"]
              }
              status = {
                S = ["PENDING"]
              }
            }
          }
        })
      }
    }
  }
  target_parameters {
    step_function_state_machine_parameters {
      invocation_type = "FIRE_AND_FORGET"
    }
  }
  log_configuration {
    level = "ERROR"
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.expire_asset_pipe.arn
    }
  }
}

resource "aws_iam_role" "expire_asset_sm" {
  name               = "${var.prefix}-expire-asset"
  assume_role_policy = data.aws_iam_policy_document.expire_asset_sm_assume.json
}

data "aws_iam_policy_document" "expire_asset_sm_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "expire_asset_sm" {
  name   = "${var.prefix}-expire-asset"
  policy = data.aws_iam_policy_document.expire_asset_sm.json
}

data "aws_iam_policy_document" "expire_asset_sm" {
  statement {
    sid = "SendToBus"
    actions = [
      "events:PutEvents"
    ]
    resources = [
      aws_cloudwatch_event_bus.bus.arn
    ]
  }
}

resource "aws_iam_role_policy_attachment" "expire_asset_sm" {
  role       = aws_iam_role.expire_asset_sm.name
  policy_arn = aws_iam_policy.expire_asset_sm.arn
}

resource "aws_sfn_state_machine" "expire_asset_sm" {
  # checkov:skip=CKV_AWS_285: Figure out logging later
  name     = "${var.prefix}-expire-asset"
  role_arn = aws_iam_role.expire_asset_sm.arn
  tracing_configuration {
    enabled = true
  }
  definition = jsonencode(yamldecode(templatefile(
    "${path.module}/../../../sfn/asset-expirer.yaml",
    {
      bus_arn     = aws_cloudwatch_event_bus.bus.arn
      source      = local.expire_asset_source
      detail_type = local.expire_asset_detail_type
    }
  )))
  depends_on = [
    aws_iam_policy.expire_asset_sm,
    aws_iam_role_policy_attachment.expire_asset_sm,
  ]
}

resource "aws_iam_role" "expire_asset_bus" {
  name               = "${var.prefix}-expire-asset-bus"
  assume_role_policy = data.aws_iam_policy_document.expire_asset_bus_assume.json
}

data "aws_iam_policy_document" "expire_asset_bus_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "expire_asset_bus" {
  name   = "${var.prefix}-expire-asset-bus"
  policy = data.aws_iam_policy_document.expire_asset_bus.json
}

data "aws_iam_policy_document" "expire_asset_bus" {
  statement {
    sid = "InvokeGraphQL"
    actions = [
      "appsync:GraphQL",
    ]
    resources = [
      "${aws_appsync_graphql_api.graphql.arn}/types/Mutation/fields/_expireAsset",
    ]
  }
}

resource "aws_iam_role_policy_attachment" "expire_asset_bus" {
  role       = aws_iam_role.expire_asset_bus.name
  policy_arn = aws_iam_policy.expire_asset_bus.arn
}

resource "aws_cloudwatch_event_rule" "expire_asset_rule" {
  name           = "${var.prefix}-expire-asset"
  description    = "Expire assets when timeout is reached"
  event_bus_name = aws_cloudwatch_event_bus.bus.name
  state          = "ENABLED"
  event_pattern = jsonencode({
    "source"      = [local.expire_asset_source]
    "detail-type" = [local.expire_asset_detail_type]
  })
}

resource "aws_cloudwatch_event_target" "expire_asset_target" {
  target_id      = "appsync-expire-asset"
  rule           = aws_cloudwatch_event_rule.expire_asset_rule.name
  arn            = local.graphql_ep_arn
  role_arn       = aws_iam_role.expire_asset_bus.arn
  event_bus_name = aws_cloudwatch_event_bus.bus.name

  input_transformer {
    input_paths = {
      gameId  = "$.detail.gameId"
      assetId = "$.detail.assetId"
    }
    input_template = <<-EOT
      {
          "input": {
              "gameId": "<gameId>",
              "assetId": "<assetId>"
          }
      }
    EOT
  }

  appsync_target {
    graphql_operation = local.graphql_expire_asset_mutation
  }
}

# Asset finalization infrastructure

resource "aws_iam_role" "finalise_asset_bus" {
  name               = "${var.prefix}-finalise-asset-bus"
  assume_role_policy = data.aws_iam_policy_document.finalise_asset_bus_assume.json
}

data "aws_iam_policy_document" "finalise_asset_bus_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "finalise_asset_bus" {
  name   = "${var.prefix}-finalise-asset-bus"
  policy = data.aws_iam_policy_document.finalise_asset_bus.json
}

data "aws_iam_policy_document" "finalise_asset_bus" {
  statement {
    sid = "InvokeGraphQL"
    actions = [
      "appsync:GraphQL",
    ]
    resources = [
      "${aws_appsync_graphql_api.graphql.arn}/types/Mutation/fields/_finaliseAsset",
    ]
  }
}

resource "aws_iam_role_policy_attachment" "finalise_asset_bus" {
  role       = aws_iam_role.finalise_asset_bus.name
  policy_arn = aws_iam_policy.finalise_asset_bus.arn
}

resource "aws_cloudwatch_event_rule" "finalise_asset_rule" {
  name           = "${var.prefix}-finalise-asset"
  description    = "Finalize assets when original file is uploaded"
  event_bus_name = aws_cloudwatch_event_bus.bus.name
  state          = "ENABLED"
  event_pattern = jsonencode({
    "source"      = [local.finalise_asset_source]
    "detail-type" = [local.finalise_asset_detail_type]
  })
}


resource "aws_cloudwatch_event_target" "finalise_asset_target" {
  target_id      = "appsync-finalise-asset"
  rule           = aws_cloudwatch_event_rule.finalise_asset_rule.name
  arn            = local.graphql_ep_arn
  role_arn       = aws_iam_role.finalise_asset_bus.arn
  event_bus_name = aws_cloudwatch_event_bus.bus.name

  input_transformer {
    input_paths = {
      gameId    = "$.detail.gameId"
      assetId   = "$.detail.assetId"
      sectionId = "$.detail.sectionId"
    }
    input_template = <<-EOT
      {
          "input": {
              "gameId": "<gameId>",
              "assetId": "<assetId>",
              "sectionId": "<sectionId>"
          }
      }
    EOT
  }

  appsync_target {
    graphql_operation = local.graphql_finalise_asset_mutation
  }
}


