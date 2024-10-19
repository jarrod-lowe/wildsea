variable "environment" {
  description = "Name of the Environment"
  type        = string
}

variable "saml_metadata_url" {
  description = "SAML Metadata URL"
  type        = string
  sensitive   = true
  default     = "TODO"
}

variable "domain_name" {
  description = "DNS Domain to put records into"
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

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
  default_tags {
    tags = {
      Application = local.prefix
    }
  }
}

module "wildsea" {
  source = "../../module/wildsea"

  saml_metadata_url = var.saml_metadata_url
  prefix            = local.prefix
  domain_name       = var.domain_name
  log_level         = "ALL"

  providers = {
    aws           = aws
    aws.us-east-1 = aws.us-east-1
  }
}
