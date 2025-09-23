resource "aws_rum_app_monitor" "main" {
  count = var.enable_rum ? 1 : 0

  name   = "${var.prefix}-rum"
  domain_list = var.pipeline_number == null ? [local.cdn_domain_name, "localhost"] : [local.cdn_domain_name]

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

