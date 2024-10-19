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
