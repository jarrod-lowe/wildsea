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

provider "aws" {
  default_tags {
    tags = {
      Application = "Wildsea-setup-${var.environment}"
    }
  }
}
