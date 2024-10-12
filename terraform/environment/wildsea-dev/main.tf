variable "saml_metadata_url" {
  description = "SAML Metadata URL"
  type        = string
  sensitive   = true
  default     = ""
}

locals {
  app_name = "Wildsea"
  prefix   = "${local.app_name}-dev"
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
  log_level         = "ALL"
}
