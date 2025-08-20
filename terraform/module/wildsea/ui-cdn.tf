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

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "request_policy" {
  name = "Managed-CORS-S3Origin"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_policy" {
  name = "Managed-AllViewer"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host_header_policy" {
  name = "Managed-AllViewerExceptHostHeader"
}

data "aws_cloudfront_response_headers_policy" "headers_policy" {
  name = "Managed-CORS-with-preflight-and-SecurityHeadersPolicy"
}

resource "aws_cloudfront_distribution" "cdn" {
  # checkov:skip=CKV_AWS_86:Chosen not to enable access logging yet
  # checkov:skip=CKV2_AWS_47:Log4j is irrelvant for S3 origins
  # checkov:skip=CKV_AWS_310:Not enabling origin failover for S3 origin
  # checkov:skip=CKV_AWS_68:Not enabled WAF yet - $$$
  origin {
    domain_name              = aws_s3_bucket.ui.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.ui.id
    origin_access_control_id = aws_cloudfront_origin_access_control.cdn.id
  }

  //  origin {
  //    domain_name = aws_appsync_domain_name.api.appsync_domain_name
  //    //domain_name = split("/", aws_appsync_graphql_api.graphql.uris["GRAPHQL"])[2]
  //    origin_id = "appsync"
  //
  //    custom_origin_config {
  //      http_port              = 80
  //      https_port             = 443
  //      origin_protocol_policy = "https-only"
  //      origin_ssl_protocols   = ["TLSv1.2"]
  //    }
  //  }

  enabled             = true
  default_root_object = "index.html"
  aliases             = [local.cdn_domain_name]

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = aws_s3_bucket.ui.id
    cache_policy_id            = data.aws_cloudfront_cache_policy.cache_policy.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.request_policy.id
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.headers_policy.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_routing.arn
    }
  }

  //  ordered_cache_behavior {
  //    path_pattern     = "/graphql"
  //    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
  //    cached_methods   = ["GET", "HEAD"]
  //    target_origin_id = "appsync"
  //
  //    viewer_protocol_policy = "redirect-to-https"
  //    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_disabled.id
  //    //origin_request_policy_id = aws_cloudfront_origin_request_policy.websocket_policy.id
  //    //origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.all_viewer_policy.id
  //    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host_header_policy.id
  //    //response_headers_policy_id = aws_cloudfront_response_headers_policy.cors_policy.id
  //  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  #TODO - logging

  tags = {
    Name = local.cdn_name
  }
}

//resource "aws_cloudfront_origin_request_policy" "websocket_policy" {
//  name    = "WebSocketPolicy"
//  comment = "Policy for WebSocket connections"
//  cookies_config {
//    cookie_behavior = "all"
//  }
//  headers_config {
//    header_behavior = "whitelist"
//    headers {
//      items = ["Sec-WebSocket-Key", "Sec-WebSocket-Version", "Sec-WebSocket-Protocol", "Sec-WebSocket-Accept", "Origin", "Referer"]
//    }
//  }
//  query_strings_config {
//    query_string_behavior = "all"
//  }
//}

//resource "aws_cloudfront_response_headers_policy" "cors_policy" {
//  name    = "cors-policy"
//  comment = "CORS policy for GraphQL API"
//
//  cors_config {
//    access_control_allow_credentials = true
//
//    access_control_allow_headers {
//      items = ["Authorization", "Content-Type", "Origin"]
//    }
//
//    access_control_allow_methods {
//      items = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
//    }
//
//    access_control_allow_origins {
//      items = [
//        "http://localhost:5173",
//        "https://${local.cdn_domain_name}",
//      ]
//    }
//
//    origin_override = true
//  }
//}

resource "aws_acm_certificate" "cdn" {
  provider = aws.us-east-1

  domain_name       = local.cdn_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cdn_validate" {
  for_each = {
    for dvo in aws_acm_certificate.cdn.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.zone.zone_id
}

resource "aws_acm_certificate_validation" "cdn" {
  provider = aws.us-east-1

  certificate_arn         = aws_acm_certificate.cdn.arn
  validation_record_fqdns = [for record in aws_route53_record.cdn_validate : record.fqdn]
}

resource "aws_route53_record" "cdn" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = local.cdn_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}
