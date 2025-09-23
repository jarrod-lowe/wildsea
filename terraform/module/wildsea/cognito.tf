resource "aws_cognito_user_pool" "cognito" {
  name = var.prefix

  admin_create_user_config {
    allow_admin_create_user_only = true
  }
}

resource "aws_cognito_identity_provider" "idp" {
  for_each      = nonsensitive(var.saml_metadata_url) == "" ? toset([]) : toset([1])
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

locals {
  providers = compact([
    "COGNITO",
    var.saml_metadata_url == "" ? "" : aws_cognito_identity_provider.idp[0].provider_name,
    local.enable_google_auth ? aws_cognito_identity_provider.google-oauth[0].provider_name : "",
  ])
}

resource "aws_cognito_user_pool_client" "cognito" {
  name                                 = var.prefix
  user_pool_id                         = aws_cognito_user_pool.cognito.id
  generate_secret                      = false
  explicit_auth_flows                  = ["ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_PASSWORD_AUTH", "ALLOW_USER_SRP_AUTH"]
  allowed_oauth_flows_user_pool_client = true
  callback_urls                        = ["http://localhost:5173/", "http://localhost:5174/", "https://${local.cdn_domain_name}/"]
  logout_urls                          = ["http://localhost:5173/", "http://localhost:5174/", "https://${local.cdn_domain_name}/"]
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "aws.cognito.signin.user.admin"]
  supported_identity_providers         = local.providers
}

resource "aws_cognito_identity_pool" "cognito" {
  identity_pool_name               = var.prefix
  allow_unauthenticated_identities = true
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
    "authenticated"   = aws_iam_role.cognito.arn
    "unauthenticated" = aws_iam_role.cognito_unauth.arn
  }
}

resource "aws_iam_role" "cognito" {
  name               = "${var.prefix}-user"
  assume_role_policy = data.aws_iam_policy_document.cognito_assume.json
}

data "aws_iam_policy_document" "cognito_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.${data.aws_partition.current.dns_suffix}"]
    }
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.${data.aws_partition.current.dns_suffix}:aud"
      values   = [aws_cognito_identity_pool.cognito.id]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.${data.aws_partition.current.dns_suffix}:amr"
      values   = ["authenticated"]
    }
  }
}

resource "aws_iam_policy" "cognito" {
  name   = "${var.prefix}-user"
  policy = data.aws_iam_policy_document.cognito.json
}

data "aws_iam_policy_document" "cognito" {
  statement {
    actions = [
      "cognito-identity:GetCredentialsForIdentity",
    ]
    resources = ["*"] # checkov:skip=CKV_AWS_107:Has to be wildcard
  }

  # Add RUM permissions only if RUM is enabled
  dynamic "statement" {
    for_each = var.enable_rum ? [1] : []
    content {
      actions = [
        "rum:PutRumEvents"
      ]
      resources = [aws_rum_app_monitor.main[0].arn]
    }
  }

  # Add X-Ray permissions for RUM tracing
  dynamic "statement" {
    for_each = var.enable_rum ? [1] : []
    content {
      actions = [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ]
      resources = ["*"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "cognito" {
  role       = aws_iam_role.cognito.name
  policy_arn = aws_iam_policy.cognito.arn
}

# Unauthenticated role with minimal permissions
resource "aws_iam_role" "cognito_unauth" {
  name               = "${var.prefix}-unauth"
  assume_role_policy = data.aws_iam_policy_document.cognito_unauth_assume.json
}

data "aws_iam_policy_document" "cognito_unauth_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.${data.aws_partition.current.dns_suffix}"]
    }
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.${data.aws_partition.current.dns_suffix}:aud"
      values   = [aws_cognito_identity_pool.cognito.id]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.${data.aws_partition.current.dns_suffix}:amr"
      values   = ["unauthenticated"]
    }
  }
}

resource "aws_iam_policy" "cognito_unauth" {
  name   = "${var.prefix}-unauth"
  policy = data.aws_iam_policy_document.cognito_unauth.json
}

data "aws_iam_policy_document" "cognito_unauth" {
  # Minimal permissions for unauthenticated users
  statement {
    actions = [
      "cognito-identity:GetCredentialsForIdentity",
    ]
    resources = ["*"] # checkov:skip=CKV_AWS_107:Has to be wildcard
  }

  # Add RUM permissions only if RUM is enabled
  dynamic "statement" {
    for_each = var.enable_rum ? [1] : []
    content {
      actions = [
        "rum:PutRumEvents"
      ]
      resources = [aws_rum_app_monitor.main[0].arn]
    }
  }

  # Add X-Ray permissions for RUM tracing
  dynamic "statement" {
    for_each = var.enable_rum ? [1] : []
    content {
      actions = [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ]
      resources = ["*"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "cognito_unauth" {
  role       = aws_iam_role.cognito_unauth.name
  policy_arn = aws_iam_policy.cognito_unauth.arn
}

resource "aws_cognito_user_pool_domain" "cognito" {
  domain       = lower(var.prefix)
  user_pool_id = aws_cognito_user_pool.cognito.id
}

resource "aws_cognito_user_pool_ui_customization" "cognito" {
  client_id    = aws_cognito_user_pool_client.cognito.id
  css          = file("${path.module}/../../cognito-ui.css")
  user_pool_id = aws_cognito_user_pool_domain.cognito.user_pool_id

  depends_on = [aws_cognito_user_pool_domain.cognito]
}

resource "aws_cognito_identity_provider" "google-oauth" {
  count = local.enable_google_auth ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.cognito.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes              = "profile openid email"
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = true
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    oidc_issuer                   = "https://accounts.google.com"
    token_request_method          = "POST"
    token_url                     = "https://www.googleapis.com/oauth2/v4/token"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
  }
}

resource "aws_cognito_user_group" "group_CreateGame" {
  name         = "CreateGame"
  user_pool_id = aws_cognito_user_pool.cognito.id
  description  = "Users who may create new games"
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