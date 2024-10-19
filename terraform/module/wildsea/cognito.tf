resource "aws_cognito_user_pool" "cognito" {
  name = var.prefix

  admin_create_user_config {
    allow_admin_create_user_only = true
  }
}

resource "aws_cognito_identity_provider" "idp" {
  for_each      = var.saml_metadata_url == "" ? toset([]) : toset([1])
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
  name                                 = var.prefix
  user_pool_id                         = aws_cognito_user_pool.cognito.id
  generate_secret                      = false
  explicit_auth_flows                  = ["ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_PASSWORD_AUTH", "ALLOW_USER_SRP_AUTH"]
  allowed_oauth_flows_user_pool_client = true
  callback_urls                        = ["http://localhost:5173/", "https://${local.cdn_domain_name}/"]
  logout_urls                          = ["http://localhost:5173/", "https://${local.cdn_domain_name}/"]
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "aws.cognito.signin.user.admin"]
  supported_identity_providers         = [var.saml_metadata_url == "" ? "COGNITO" : aws_cognito_identity_provider.idp[0].provider_name]
}

resource "aws_cognito_identity_pool" "cognito" {
  identity_pool_name               = var.prefix
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
    "authenticated" = aws_iam_role.cognito.arn
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
}

resource "aws_iam_role_policy_attachment" "cognito" {
  role       = aws_iam_role.cognito.name
  policy_arn = aws_iam_policy.cognito.arn
}

resource "aws_cognito_user_pool_domain" "cognito" {
  domain       = lower(var.prefix)
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