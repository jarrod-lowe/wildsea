data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

variable "app_name" {
  default = "Wildsea"
}

variable "action_prefix" {
  default = "GitHubAction"
}

variable "workspace" {
  description = "Github Organisation name"
  type        = string
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
  default     = "primary"
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

import {
  to = module.state-bucket.aws_s3_bucket.state
  id = var.state_bucket
}

module "iac-roles" {
  source           = "../../module/iac-roles"
  app_name         = var.app_name
  environment      = var.environment
  action_prefix    = var.action_prefix
  workspace        = var.workspace
  repo             = var.repo
  state_bucket_arn = module.state-bucket.arn
  oidc_arn         = module.oidc.oidc_arn
  oidc_type        = "Federated"
}

module "state-bucket" {
  source       = "../../module/state-bucket"
  state_bucket = var.state_bucket
}

module "oidc" {
  source = "../../module/oidc"
}
