# Wildsea

Wildsea companion app

## Repository Setup

To set up a github repository:

* Log into Codacy, and connect the repo
  * Configure the rule to maximum
* Create a branch restriction rule called "main":
  * Enforcement: Active
  * Target Branches: Include default branch
  * Tick Restrict creations
  * Tick Restrict deletions
  * Tick Require linear history
  * Tick Require a pull request before merging
    * Require 0 Approvals
    * Require review from code owners
  * Tick Require status checks to pass
    * Tick require branches to be up to date before merging
    * Add "Codacy Static Code Analysis" to status checks that are required
  * Block force pushes
  * TODO: Require code scanning results
* Install <https://github.com/apps/renovate> into the repo
* Under settings, "Set up code scanning"
  * Enable everything exeept Dependabot version updates
  * Set up CodeQL to default
  * Set the Protection rules to Any/Any
* Create an AWS Account for deployment
  * Set up OIDC as per <https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/>
  * Restrict it to the repo and branch main
  * Add AdministratorAccess, for now, and call it GitHubAccess-Wildsea@main
  * Add another role with ReadyOnlyAccess, don't restrict the branch, and call it GitHubAccess-Wildsea
* Add an environment "main"
  * Add an Environment Secret "AWS_ACCOUNT" with the ID of the AWS Account
  * Add an Environment Secret "AWS_REGION" with the AWS Region you want to use
