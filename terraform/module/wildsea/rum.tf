resource "aws_rum_app_monitor" "main" {
  count = var.enable_rum ? 1 : 0

  name        = "${var.prefix}-rum"
  domain_list = var.prefix == "Wildsea-dev" ? [local.cdn_domain_name, "localhost"] : [local.cdn_domain_name]

  app_monitor_configuration {
    allow_cookies = true
    enable_xray   = true

    telemetries = ["errors", "performance", "http"]

    session_sample_rate = var.rum_sample_rate

    # Guest sessions are anonymous sessions without authentication
    guest_role_arn = aws_iam_role.cognito_unauth.arn

    # Identity pool ID from Cognito for authenticated users
    identity_pool_id = aws_cognito_identity_pool.cognito.id
  }

  tags = {
    Name        = "${var.prefix}-rum"
    Environment = var.prefix
  }
}

# RUM metrics destination for CloudWatch
resource "aws_rum_metrics_destination" "main" {
  count = var.enable_rum ? 1 : 0

  app_monitor_name = aws_rum_app_monitor.main[0].name
  destination      = "CloudWatch"
}

# CloudWatch Alarms for RUM monitoring
resource "aws_cloudwatch_metric_alarm" "rum_error_rate" {
  count = var.enable_rum ? 1 : 0

  alarm_name          = "${var.prefix}-rum-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "JsErrorCountPerSession"
  namespace           = "AWS/RUM"
  period              = 300
  statistic           = "Average"
  threshold           = 0.1
  alarm_description   = "This metric monitors RUM JavaScript errors per session - alerts when more than 0.1 errors per session occur"

  dimensions = {
    application_name = aws_rum_app_monitor.main[0].name
  }

  alarm_actions      = [var.sns_alarm_topic_arn]
  ok_actions         = [var.sns_alarm_topic_arn]
  treat_missing_data = "notBreaching"

  tags = {
    Name        = "${var.prefix}-rum-high-error-rate"
    Environment = var.prefix
  }
}

resource "aws_cloudwatch_metric_alarm" "rum_navigation_duration" {
  count = var.enable_rum ? 1 : 0

  alarm_name          = "${var.prefix}-rum-slow-navigation"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "PerformanceNavigationDuration"
  namespace           = "AWS/RUM"
  period              = 300
  extended_statistic  = "p90"
  threshold           = 2000
  alarm_description   = "This metric monitors RUM navigation duration - alerts when p90 page load is slower than 2 seconds"

  dimensions = {
    application_name = aws_rum_app_monitor.main[0].name
  }

  alarm_actions      = [var.sns_alarm_topic_arn]
  ok_actions         = [var.sns_alarm_topic_arn]
  treat_missing_data = "notBreaching"

  tags = {
    Name        = "${var.prefix}-rum-slow-navigation"
    Environment = var.prefix
  }
}

resource "aws_cloudwatch_metric_alarm" "rum_http_4xx_errors" {
  count = var.enable_rum ? 1 : 0

  alarm_name          = "${var.prefix}-rum-http-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Http4xxCountPerSession"
  namespace           = "AWS/RUM"
  period              = 300
  statistic           = "Average"
  threshold           = 0.05
  alarm_description   = "This metric monitors RUM HTTP 4xx errors per session - alerts when more than 0.05 errors per session occur"

  dimensions = {
    application_name = aws_rum_app_monitor.main[0].name
  }

  alarm_actions      = [var.sns_alarm_topic_arn]
  ok_actions         = [var.sns_alarm_topic_arn]
  treat_missing_data = "notBreaching"

  tags = {
    Name        = "${var.prefix}-rum-http-4xx-errors"
    Environment = var.prefix
  }
}

