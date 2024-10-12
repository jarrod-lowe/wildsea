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

module "wildsea" {
  source = "../../module/wildsea"

  saml_metadata_url = var.saml_metadata_url
  prefix            = local.prefix
  log_level         = "ERROR"
}
