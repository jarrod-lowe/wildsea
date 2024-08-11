data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

variable "prefix" {
    description = "Resource name prefix"
    type = string
}

variable "saml_metadata_url" {
    description = "SAML metadata URL"
    type = string
}
