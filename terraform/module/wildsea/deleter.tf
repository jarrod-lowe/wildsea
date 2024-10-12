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
  graphql_delete_player_mutation = <<-EOT
        mutation DeletePlayerBackground($input: DeletePlayerInput!) {
            deletePlayer(input: $input) {
                gameId
                userId
                deleted
            }
        }
    EOT
  delete_source                  = "wildsea.table"
  delete_player_detail_type      = "DeletePlayer"
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

resource "aws_cloudformation_stack" "delete_action" {
  # checkov:skip=CKV_AWS_124: Do not want a SNS notification
  name = "${var.prefix}-delete-actions"
  template_body = jsonencode({
    AWSTemplateFormatVersion = "2010-09-09"
    Resources = {
      "DeletePlayerRule" = {
        Type = "AWS::Events::Rule"
        Properties = {
          Name         = "${var.prefix}-delete-player"
          Description  = "Delete players on deleted game"
          EventBusName = aws_cloudwatch_event_bus.bus.name
          State        = "ENABLED"
          EventPattern = jsonencode({
            "source"      = [local.delete_source]
            "detail-type" = [local.delete_player_detail_type]
          })
          Targets = [{
            Arn     = local.graphql_ep_arn
            Id      = "DeletePlayer"
            RoleArn = aws_iam_role.deleter_bus.arn
            InputTransformer = {
              InputPathsMap = {
                gameId = "$.detail.gameId"
                userId = "$.detail.userId"
              }
              InputTemplate = <<-EOT
                {
                    "input": {
                        "gameId": "<gameId>",
                        "userId": "<userId>"
                    }
                }
              EOT
            }
            AppSyncParameters = {
              GraphQLOperation = local.graphql_delete_player_mutation
            }
          }]
        }
      }
    }
  })
}
