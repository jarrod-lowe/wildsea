terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

variable "token" {
  description = "Github Token"
  sensitive   = true
  type        = string
}

variable "workspace" {
  description = "Github Organisation name"
  type        = string
}

variable "repo" {
  description = "Repository name"
  type        = string
  default     = "wildsea"
}

variable "aws_account" {
  description = "AWS Account ID"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-southeast-2"
}

variable "state_bucket" {
  description = "State Bucket to use for deploys"
  type        = string
}

variable "environment" {
  description = "Unique name for the deployment"
  type        = string
  default     = "primary"
}

terraform {
    backend "s3" {
        // region, bucket and key come from -backend-config
    }
}

provider "github" {
  token = var.token
}

data "github_user" "current" {
  username = ""
}

data "github_repository" "repo" {
  full_name = "${var.workspace}/${var.repo}"
}

resource "github_repository_ruleset" "ruleset" {
  name        = "primary"
  repository  = data.github_repository.repo.name
  target      = "branch"
  enforcement = "active"

  rules {
    creation                = true
    deletion                = true
    non_fast_forward        = true
    required_linear_history = true
    required_signatures     = true
    pull_request {
      dismiss_stale_reviews_on_push     = true
      require_code_owner_review         = true
      require_last_push_approval        = false
      required_approving_review_count   = 0
      required_review_thread_resolution = true
    }
    required_deployments {
      required_deployment_environments = [
        #                github_repository_environment.ro.id
      ]
    }
    required_status_checks {
      strict_required_status_checks_policy = true
      required_check {
        context = "Codacy Static Code Analysis"
      }
    }
  }

  conditions {
    ref_name {
      exclude = []
      include = [
        "~DEFAULT_BRANCH"
      ]
    }
  }
}

locals {
  rw_vars = {
    AWS_ROLE     = "GitHubAction-Wildsea-rw-${var.environment}"
    AWS_ACCOUNT  = var.aws_account
    AWS_REGION   = var.aws_region
    STATE_BUCKET = var.state_bucket
    ENVIRONMENT  = var.environment
  }
  ro_vars = {
    AWS_ROLE     = "GitHubAction-Wildsea-ro-${var.environment}"
    AWS_ACCOUNT  = var.aws_account
    AWS_REGION   = var.aws_region
    STATE_BUCKET = var.state_bucket
    ENVIRONMENT  = var.environment
  }
}

resource "github_repository_environment" "rw" {
  environment = "${var.environment}-rw"
  repository  = data.github_repository.repo.name
  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "rw" {
  environment    = github_repository_environment.rw.environment
  repository     = data.github_repository.repo.name
  branch_pattern = "main"
}

resource "github_repository_environment" "ro" {
  environment = "${var.environment}-ro"
  repository  = data.github_repository.repo.name
}

resource "github_actions_environment_variable" "rw" {
  for_each = local.rw_vars

  environment   = github_repository_environment.rw.environment
  repository    = data.github_repository.repo.name
  variable_name = each.key
  value         = each.value
}

resource "github_actions_environment_variable" "ro" {
  for_each = local.ro_vars

  environment   = github_repository_environment.ro.environment
  repository    = data.github_repository.repo.name
  variable_name = each.key
  value         = each.value
}
