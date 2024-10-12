resource "aws_cloudwatch_event_bus" "bus" {
  name = var.prefix
}

resource "aws_cloudwatch_event_bus_policy" "bus" {
  event_bus_name = aws_cloudwatch_event_bus.bus.name
  policy         = data.aws_iam_policy_document.bus.json
}

data "aws_iam_policy_document" "bus" {
  statement {
    sid = "AllowDeleterStepFunction"
    actions = [
      "events:PutEvents",
    ]
    resources = [
      aws_cloudwatch_event_bus.bus.arn,
    ]
    principals {
      type        = "Service"
      identifiers = ["states.${data.aws_region.current.id}.${data.aws_partition.current.dns_suffix}"]
    }

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        aws_sfn_state_machine.delete_player_sm.arn
      ]
    }
  }
}
