resource "aws_cloudfront_function" "spa_routing" {
  name    = "${var.prefix}-spa-routing"
  runtime = "cloudfront-js-1.0"
  comment = "SPA routing function to handle client-side routing"
  publish = true
  code    = file("${path.module}/spa-routing.js")
}