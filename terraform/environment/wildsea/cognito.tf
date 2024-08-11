resource "aws_cognito_user_pool" "cognito" {
  name = local.prefix

  admin_create_user_config {
    allow_admin_create_user_only = true
  }
}

resource "aws_cognito_identity_provider" "idp" {
  user_pool_id  = aws_cognito_user_pool.cognito.id
  provider_name = "SAML"
  provider_type = "SAML"

  provider_details = {
    MetadataURL = var.saml_metadata_url
  }

  attribute_mapping = {
    email          = "email"
    email_verified = "emailVerified"
    family_name    = "lastname"
    given_name     = "firstname"
  }
}

resource "aws_cognito_user_pool_client" "cognito" {
  name                                 = local.prefix
  user_pool_id                         = aws_cognito_user_pool.cognito.id
  generate_secret                      = true
  explicit_auth_flows                  = ["USER_PASSWORD_AUTH", "ALLOW_USER_PASSWORD_AUTH", "ALLOW_USER_SRP_AUTH"]
  allowed_oauth_flows_user_pool_client = true
  callback_urls                        = ["TODO"]
  logout_urls                          = ["TODO"]
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["openid"]
  supported_identity_providers         = [aws_cognito_identity_provider.idp.provider_name]
}

resource "aws_cognito_identity_pool" "cognito" {
  identity_pool_name               = local.prefix
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.cognito.id
    provider_name           = "cognito-idp.${data.aws_region.current.id}.${data.aws_partition.current.dns_suffix}/${aws_cognito_user_pool.cognito.id}"
    server_side_token_check = true
  }
}

resource "aws_cognito_identity_pool_roles_attachment" "cognito" {
  identity_pool_id = aws_cognito_identity_pool.cognito.id
  roles = {
    "authenticated" = "TODO"
  }
}

resource "aws_cognito_user_pool_domain" "cognito" {
  domain       = local.prefix
  user_pool_id = aws_cognito_user_pool.cognito.id
}

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.cognito.id
}

output "identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = aws_cognito_identity_pool.cognito.id
}

output "web_client_id" {
  description = "Cognito Web Client ID"
  value       = aws_cognito_user_pool_client.cognito.id
}

output "login_domain" {
  description = "Cognito Login Domain"
  value       = nonsensitive(sensitive("${aws_cognito_user_pool_domain.cognito.domain}.auth.${data.aws_region.current.id}.${data.aws_partition.current.dns_suffix}"))
}