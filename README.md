# Wildsea

Wildsea companion app

## Repository Setup

To set up a github repository:

* Log into Codacy, and connect the repo
* Create a branch restriction rule called "main":
  * Enforcement: Active
  * Target Branches: Include default branch
  * Tick Restrict creations
  * Tick Restrict updates
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
