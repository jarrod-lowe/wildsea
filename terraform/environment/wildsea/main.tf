variable "aws_account" {
  description = "ID of the AWS Account"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS Region name"
  type        = string
  sensitive   = true
}

variable "state_bucket" {
  description = "Name of the S3 state bucket"
  type        = string
}

variable "environment" {
  description = "Name of the Environment"
  type        = string
}

locals {
  app_name = "Wildsea"
  prefix   = "${local.app_name}-${var.environment}"
}

terraform {
  backend "s3" {
    // region, bucket and key come from -backend-config
  }
}

provider "aws" {
  default_tags {
    tags = {
      Application = local.prefix
    }
  }
}
