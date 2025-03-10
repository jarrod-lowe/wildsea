terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 5.0"
      configuration_aliases = [aws, aws.us-east-1]
    }
  }
}

data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "saml_metadata_url" {
  description = "SAML metadata URL"
  type        = string
}

variable "enable_waf" {
  description = "Enable WAF? Has cost implications"
  type        = bool
  default     = false
}

variable "log_level" {
  description = "Appsync log level"
  type        = string
  default     = "ERROR"
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "google_client_id" {
  description = "Google client ID"
  sensitive   = true
  type        = string
  nullable    = true
}

variable "google_client_secret" {
  description = "Google client secret"
  sensitive   = true
  type        = string
  nullable    = true
}

locals {
  appsync_domain_name = "api-${lower(var.prefix)}.${var.domain_name}"
  cdn_domain_name     = var.prefix == "Wildsea-primary" ? var.domain_name : "${lower(var.prefix)}.${var.domain_name}"
  enable_google_auth  = var.google_client_id != null && var.google_client_secret != null
}

data "aws_route53_zone" "zone" {
  name = var.domain_name
}
