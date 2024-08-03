resource "null_resource" "test" {}

data "aws_region" "current" {}

output "aws_region" {
    value = data.aws_region.current.id
}
