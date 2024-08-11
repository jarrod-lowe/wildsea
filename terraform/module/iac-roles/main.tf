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

variable "environment" {
  description = "Unique name for the deployment"
  type        = string
  default     = "primary"
}

variable "state_bucket_arn" {
  description = "ARN of the state bucket"
  type        = string
}

variable "oidc_arn" {
  description = "ARN of the OIDC provider"
  type        = string
}

variable "oidc_type" {
  description = "Type of principal for the OIDC Provider"
  type        = string
  default     = "Federated"
}

locals {
  prefix = "${var.app_name}-${var.environment}"
}
