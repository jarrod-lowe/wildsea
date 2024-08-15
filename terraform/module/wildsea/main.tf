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
  description = "Enable WAF? Has codt implications"
  type        = bool
  default     = false
}
