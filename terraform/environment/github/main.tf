resource "null_resource" "test" {}

variable "aws_account" {
    description = "ID of the AWS Account"
    type = string
    sensitive = true
}

variable "aws_region" {
    description = "AWS Region name"
    type = string
    sensitive = true
}

variable "state_bucket" {
    description = "Name of the S3 state bucket"
    type        = string
}

variable "environment" {
    description = "Name of the Environment"
    type        = string
}

terraform {
    backend "s3" {
        // region, bucket and key come from -backend-config
    }
}

provider "aws" {
    assume_role {
      role_arn = "arn:aws:iam::${var.aws_account}:role/GitHubAction-Wildsea"
    }
}
