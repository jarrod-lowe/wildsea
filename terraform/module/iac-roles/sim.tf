# Doesn't work yet - TODO
# data "aws_iam_principal_policy_simulation" "state_read" {
#   action_names = [
#     "s3:GetObject"
#   ]
#   policy_source_arn = aws_iam_role.ro.arn
#   resource_arns = [
#     "${var.state_bucket_arn}/${var.environment}/terraform.tfstate",
#   ]
#   #resource_policy_json = data.aws_iam_policy_document.ro.json
# 
#   depends_on = [aws_iam_policy.ro]
# 
#   lifecycle {
#     postcondition {
#       condition     = self.all_allowed
#       error_message = "state_read check failed: ${jsonencode(self.results)}"
#     }
#   }
# }
