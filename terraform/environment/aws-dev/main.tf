data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

variable "app_name" {
  default = "Wildsea"
}

variable "action_prefix" {
  default = "GitHubAction"
}

variable "repo" {
  description = "Repository name"
  type        = string
  default     = "wildsea"
}

variable "state_bucket" {
  description = "State Bucket to use for deploys"
  type        = string
}

variable "environment" {
  description = "Unique name for the deployment"
  type        = string
  default     = "dev"
}

terraform {
  backend "s3" {
    // region, bucket and key come from -backend-config
  }
}

locals {
  prefix = "${var.app_name}-${var.environment}"
}

provider "aws" {
  default_tags {
    tags = {
      Application = "${var.app_name}-setup-${var.environment}"
    }
  }
}

module "iac-roles" {
  source           = "../../module/iac-roles"
  app_name         = var.app_name
  environment      = var.environment
  action_prefix    = var.action_prefix
  workspace        = "none"
  repo             = var.repo
  state_bucket_arn = "arn:${data.aws_partition.current.id}:s3:::${var.state_bucket}"
  oidc_type        = "AWS"
  oidc_arn         = data.aws_caller_identity.current.account_id
}
