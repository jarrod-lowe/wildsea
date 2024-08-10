# Wildsea

Wildsea companion app

## Repository Setup

To set up a github repository:

* Create an AWS Account for deployment
  * Define a profile in your `~/.aws/config` to access it as admin for the initial setup deploys
* Create an S3 bucket `terraform-state-<accountid>`
* Create `terraform/environment/aws/terraform.tfvars`
  * Add `workspace = "<your github org>"` to the vars file
* Run `.AWS_PROFILE=<profile> ./terraform/environment/github/aws.sh <aws account id>`
* Log into Codacy, and connect the repo
  * Configure the rule to maximum
* Log into Github and create a personal access token with the "repo" scope, and 7 days expiry
* Create `terraform/environment/github/terraform.tfvars`
  * Add `token = "<the token>"` to the vars file
  * Add `workspace = "<your github org>"` to the vars file
* Run `.AWS_PROFILE=<profile> ./terraform/environment/github/deploy.sh <aws account id>`

* Install <https://github.com/apps/renovate> into the repo

To automate:

* In Github, Under settings, "Set up code scanning"
  * Enable everything except Dependabot version updates
  * Set up CodeQL to default
  * Set the Protection rules to Any/Any
