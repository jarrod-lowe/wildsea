variable "environment" {
  description = "Name of the Environment"
  type        = string
  default     = "dev"
}

locals {
  log_level = "ALL"
}
