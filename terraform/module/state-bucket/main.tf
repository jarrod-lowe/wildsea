data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

variable "state_bucket" {
  description = "State Bucket to use for deploys"
  type        = string
}
