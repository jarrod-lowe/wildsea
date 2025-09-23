output "cognito_identity_pool_id" {
  value = aws_cognito_identity_pool.cognito.id
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.cognito.id
}

output "cognito_web_client_id" {
  value = aws_cognito_user_pool_client.cognito.id
}

output "graphql_uri" {
  //value = aws_appsync_graphql_api.graphql.uris["GRAPHQL"]
  value = "https://${local.appsync_domain_name}/graphql"
  //value = "https://${aws_cloudfront_distribution.cdn.domain_name}/graphql"
  //value = "https://${local.cdn_domain_name}/graphql"
}

output "region" {
  value = data.aws_region.current.name
}

output "cognito_login_domain" {
  value = "${aws_cognito_user_pool_domain.cognito.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

output "ui_bucket" {
  value = aws_s3_bucket.ui.bucket
}

output "cdn_id" {
  value = aws_cloudfront_distribution.cdn.id
}

output "cdn_domain_name" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "rum_app_monitor_id" {
  value = var.enable_rum ? aws_rum_app_monitor.main[0].app_monitor_id : null
}

output "rum_app_monitor_name" {
  value = var.enable_rum ? aws_rum_app_monitor.main[0].name : null
}

output "rum_config" {
  value = var.enable_rum ? {
    applicationId      = aws_rum_app_monitor.main[0].app_monitor_id
    applicationVersion = local.app_version
    applicationRegion  = data.aws_region.current.name
    identityPoolId     = aws_cognito_identity_pool.cognito.id
    guestRoleArn       = aws_iam_role.cognito_unauth.arn
    endpoint           = "https://dataplane.rum.${data.aws_region.current.name}.${data.aws_partition.current.dns_suffix}"
    telemetries        = ["errors", "performance", "http"]
    allowCookies       = true
    enableXRay         = true
    sessionSampleRate  = var.rum_sample_rate
  } : null
}
