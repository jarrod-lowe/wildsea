locals {
  cdn_name = "${var.prefix}-cdn"
}

resource "aws_cloudfront_origin_access_control" "cdn" {
  name                              = local.cdn_name
  description                       = "CDN for UI"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_cloudfront_cache_policy" "cache_policy" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "request_policy" {
  name = "Managed-CORS-S3Origin"
}

data "aws_cloudfront_response_headers_policy" "headers_policy" {
  name = "Managed-CORS-with-preflight-and-SecurityHeadersPolicy"
}

# nosemgrep: aws-insecure-cloudfront-distribution-tls-version // Can't set with default certificate
resource "aws_cloudfront_distribution" "cdn" {
  # checkov:skip=CKV2_AWS_42:Not set up custom domain yet
  # checkov:skip=CKV_AWS_86:Chosen not to enable access logging yet
  # checkov:skip=CKV2_AWS_47:Log4j is irrelvant for S3 origins
  # checkov:skip=CKV_AWS_310:Not enabling origin failover for S3 origin
  # checkov:skip=CKV_AWS_68:Not enabled WAF yet - $$$
  # checkov:skip=CKV_AWS_174:Cannot set TLS version with default certificate
  origin {
    domain_name              = aws_s3_bucket.ui.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.ui.id
    origin_access_control_id = aws_cloudfront_origin_access_control.cdn.id
  }

  enabled             = true
  default_root_object = "index.html"
  #aliases - TODO Use our own DNS name

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = aws_s3_bucket.ui.id
    cache_policy_id            = data.aws_cloudfront_cache_policy.cache_policy.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.request_policy.id
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.headers_policy.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    #minimum_protocol_version       = "TLSv1.2_2021" # Not available on default certificate
  }

  #TODO - logging

  tags = {
    Name = local.cdn_name
  }
}
