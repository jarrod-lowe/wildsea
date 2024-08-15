data "aws_partition" "current" {}

resource "aws_iam_openid_connect_provider" "oidc" {
  url = "https://token.actions.githubusercontent.com"
  client_id_list = [
    "sts.${data.aws_partition.current.dns_suffix}"
  ]
  thumbprint_list = [
    "d89e3bd43d5d909b47a18977aa9d5ce36cee184c"
  ]
}

output "oidc_arn" {
  value = aws_iam_openid_connect_provider.oidc.arn
}
