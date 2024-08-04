resource "null_resource" "test" {}

data "aws_region" "current" {}

output "aws_region" {
    value = data.aws_region.current.id
}

variable "aws_account" {
    type = string
    sensitive = true
}

#variable "aws_region" {
#    type = string
#    sensitive = true
#}

provider "aws" {
    assume_role {
      role_arn = "arn:aws:iam::${var.aws_account}:role/GitHubAction-Wildsea"
    }
}

resource "aws_ssm_parameter" "test" {
    name = "test"
    type = "String"
    value = "test"
}
