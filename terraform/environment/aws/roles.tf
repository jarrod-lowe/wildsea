resource "aws_iam_openid_connect_provider" "oidc" {
    url = "https://token.actions.githubusercontent.com"
    client_id_list = [
        "sts.${data.aws_partition.current.dns_suffix}"
    ]
    thumbprint_list = [
        "d89e3bd43d5d909b47a18977aa9d5ce36cee184c"
    ]
}

resource "aws_iam_role" "ro" {
    name = "${var.action_prefix}-${var.app_name}-ro-${var.environment}"
    assume_role_policy = data.aws_iam_policy_document.ro_assume.json

    tags = {
        Name = "${var.action_prefix}-${var.app_name}-ro-${var.environment}"
    }
}

data "aws_iam_policy_document" "ro_assume" {
    statement {
      actions = ["sts:AssumeRoleWithWebIdentity"]
      principals {
        type = "Federated"
        identifiers = [ aws_iam_openid_connect_provider.oidc.arn ]
      }
      condition {
        test = "StringEquals"
        variable = "token.actions.githubusercontent.com:aud"
        values = ["sts.${data.aws_partition.current.dns_suffix}"]
      }
      condition {
        test = "StringEquals"
        variable = "token.actions.githubusercontent.com:sub"
        values = ["repo:${var.workspace}/${var.repo}:environment:${var.environment}-ro"]
      }
    }
}

resource "aws_iam_policy" "ro" {
    name = aws_iam_role.ro.name
    policy = data.aws_iam_policy_document.ro.json

    tags = {
        Name = aws_iam_role.ro.name
    }
}

resource "aws_iam_role_policy_attachment" "ro-ro" {
    role = aws_iam_role.ro.name
    policy_arn = aws_iam_policy.ro.arn
}

data "aws_iam_policy_document" "ro" {
    statement {
        sid = "ReadState"
        actions = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        resources = [
          "${aws_s3_bucket.state.arn}/${var.environment}/terraform.tfstate"
        ]
    }
}

resource "aws_iam_role" "rw" {
    name = "${var.action_prefix}-${var.app_name}-rw-${var.environment}"
    assume_role_policy = data.aws_iam_policy_document.rw_assume.json
    permissions_boundary = aws_iam_policy.rw_boundary.arn

    tags = {
        Name = "${var.action_prefix}-${var.app_name}-rw-${var.environment}"
    }
}

data "aws_iam_policy_document" "rw_assume" {
    statement {
      actions = ["sts:AssumeRoleWithWebIdentity"]
      principals {
        type = "Federated"
        identifiers = [ aws_iam_openid_connect_provider.oidc.arn ]
      }
      condition {
        test = "StringEquals"
        variable = "token.actions.githubusercontent.com:aud"
        values = ["sts.${data.aws_partition.current.dns_suffix}"]
      }
      condition {
        test = "StringEquals"
        variable = "token.actions.githubusercontent.com:sub"
        values = ["repo:${var.workspace}/${var.repo}:environment:${var.environment}-rw"]
      }
    }
}

resource "aws_iam_policy" "rw" {
    name = aws_iam_role.rw.name
    policy = data.aws_iam_policy_document.rw.json

    tags = {
        Name = aws_iam_role.rw.name
    }
}

resource "aws_iam_role_policy_attachment" "rw-ro" {
    role = aws_iam_role.rw.name
    policy_arn = aws_iam_policy.ro.arn
}

resource "aws_iam_role_policy_attachment" "rw-rw" {
    role = aws_iam_role.rw.name
    policy_arn = aws_iam_policy.rw.arn
}

data "aws_iam_policy_document" "rw" {
    statement {
        sid = "WriteState"
        actions = [
          "s3:PutObject"
        ]
        resources = [
          "${aws_s3_bucket.state.arn}/${var.environment}/terraform.tfstate"
        ]
    }
}

resource "aws_iam_policy" "rw_boundary" {
    name = "${var.action_prefix}-${var.app_name}-rw-${var.environment}-boundary"
    policy = data.aws_iam_policy_document.rw_boundary.json

    tags = {
        Name = "${var.action_prefix}-${var.app_name}-rw-${var.environment}-boundary"
    }
}

data "aws_iam_policy_document" "rw_boundary" {
    statement {
      sid = "s3"
      actions = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ]
      resources = [
          "${aws_s3_bucket.state.arn}/${var.environment}/terraform.tfstate",
          "arn:${data.aws_partition.current.id}:s3:::${var.app_name}-${var.environment}-*/*"
      ]
    }
}
