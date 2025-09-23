variable "saml_metadata_url" {
  description = "SAML Metadata URL"
  type        = string
  sensitive   = true
  default     = ""
}

variable "domain_name" {
  description = "DNS Domain to put records into"
  type        = string
}

variable "google_client_id" {
  description = "Google Client ID"
  type        = string
  sensitive   = true
  default     = null
}

variable "google_client_secret" {
  description = "Google Client Secret"
  type        = string
  sensitive   = true
  default     = null
}

variable "pipeline_number" {
  description = "GitHub pipeline number for versioning"
  type        = string
  default     = null
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

  saml_metadata_url    = var.saml_metadata_url
  prefix               = local.prefix
  domain_name          = var.domain_name
  log_level            = local.log_level
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  pipeline_number      = var.pipeline_number

  providers = {
    aws           = aws
    aws.us-east-1 = aws.us-east-1
  }
}
