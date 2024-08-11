resource "aws_iam_role" "ro" {
  name               = "${var.action_prefix}-${var.app_name}-ro-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.ro_assume.json

  tags = {
    Name = "${var.action_prefix}-${var.app_name}-ro-${var.environment}"
  }
}

data "aws_iam_policy_document" "ro_assume" {
  statement {
    actions = [ var.oidc_type == "Federated" ? "sts:AssumeRoleWithWebIdentity" : "sts:AssumeRole" ]
    principals {
      type        = var.oidc_type
      identifiers = [var.oidc_arn]
    }
    dynamic "condition" {
      for_each = var.oidc_type == "Federated" ? toset([1]) : toset([])
      content {
        test     = "StringEquals"
        variable = "token.actions.githubusercontent.com:aud"
        values   = ["sts.${data.aws_partition.current.dns_suffix}"]
      }
    }
    dynamic "condition" {
      for_each = var.oidc_type == "Federated" ? toset([1]) : toset([])
      content {
        test     = "StringEquals"
        variable = "token.actions.githubusercontent.com:sub"
        values   = ["repo:${var.workspace}/${var.repo}:environment:${var.environment}-ro"]
      }
    }
  }
}

resource "aws_iam_policy" "ro" {
  name   = aws_iam_role.ro.name
  policy = data.aws_iam_policy_document.ro.json

  tags = {
    Name = aws_iam_role.ro.name
  }
}

resource "aws_iam_role_policy_attachment" "ro-ro" {
  role       = aws_iam_role.ro.name
  policy_arn = aws_iam_policy.ro.arn
}

resource "aws_iam_role" "rw" {
  name                 = "${var.action_prefix}-${var.app_name}-rw-${var.environment}"
  assume_role_policy   = data.aws_iam_policy_document.rw_assume.json
  permissions_boundary = aws_iam_policy.rw_boundary.arn

  tags = {
    Name = "${var.action_prefix}-${var.app_name}-rw-${var.environment}"
  }
}

data "aws_iam_policy_document" "rw_assume" {
  statement {
    actions = [ var.oidc_type == "Federated" ? "sts:AssumeRoleWithWebIdentity" : "sts:AssumeRole" ]
    principals {
      type        = var.oidc_type
      identifiers = [var.oidc_arn]
    }
    dynamic "condition" {
      for_each = var.oidc_type == "Federated" ? toset([1]) : toset([])
      content {
        test     = "StringEquals"
        variable = "token.actions.githubusercontent.com:aud"
        values   = ["sts.${data.aws_partition.current.dns_suffix}"]
      }
    }
    dynamic "condition" {
      for_each = var.oidc_type == "Federated" ? toset([1]) : toset([])
      content {
        test     = "StringEquals"
        variable = "token.actions.githubusercontent.com:sub"
        values   = ["repo:${var.workspace}/${var.repo}:environment:${var.environment}-rw"]
      }
    }
  }
}

resource "aws_iam_policy" "rw" {
  name   = aws_iam_role.rw.name
  policy = data.aws_iam_policy_document.rw.json

  tags = {
    Name = aws_iam_role.rw.name
  }
}

resource "aws_iam_role_policy_attachment" "rw-ro" {
  role       = aws_iam_role.rw.name
  policy_arn = aws_iam_policy.ro.arn
}

resource "aws_iam_role_policy_attachment" "rw-rw" {
  role       = aws_iam_role.rw.name
  policy_arn = aws_iam_policy.rw.arn
}

resource "aws_iam_policy" "rw_boundary" {
  name   = "${var.action_prefix}-${var.app_name}-rw-${var.environment}-boundary"
  policy = data.aws_iam_policy_document.rw_boundary.json

  tags = {
    Name = "${var.action_prefix}-${var.app_name}-rw-${var.environment}-boundary"
  }
}
