# Wildsea

Wildsea companion app

## Setup

* Clone `git@github.com:jarrod-lowe/wildsea.git` and then `cd wildsea`
* Configure git:

  ```bash
  git config gpg.format ssh
  git config user.signingkey ~/.ssh/id_rsa
  git config commit.gpgsign true
  ```

* Create an AWS Account for deployment
  * Define a profile in your `~/.aws/config` to access it as admin for the initial setup deploys
* Create an S3 bucket `terraform-state-<accountid>`
* Create `terraform/environment/aws/terraform.tfvars`
  * Add `workspace = "<your github org>"` to the vars file
* Run `.AWS_PROFILE=<profile> ./terraform/environment/github/aws.sh <aws account id>`
* Log into Codacy, and connect the repo
  * Configure the rule to maximum
* In Codacy, in the repo, go to code patterns, and edit the coding standard:
  * Set the languages to: CSS, Go, JSON, Markdown, Python, Shell, Terraform, Typescript, XML, YAML
  * Select every tool that is:
    * NOT client-side
    * NOT deprecated
    * NOT remark-lint
    * Matches one of the above languages
* Log into Github and create a personal access token with the "repo" scope, and 7 days expiry
* Create `terraform/environment/github/terraform.tfvars`
  * Add `token = "<the token>"` to the vars file
  * Add `workspace = "<your github org>"` to the vars file
* Run `.AWS_PROFILE=<profile> ./terraform/environment/github/deploy.sh <aws account id>`
* Install <https://github.com/apps/renovate> into the repo
* Go into the two environments, and set a secret called `SAML_METADATA_URL` with the metadata URL for you SAML (See Jumpcloud for an example)

To automate:

* In Github, Under settings, "Set up code scanning"
  * Enable everything except Dependabot version updates
  * Set up CodeQL to default
  * Set the Protection rules to Any/Any

## Jumpcloud

To integrate with Jumpcloud as your SAML Provider, get the output User Pool Id
and domain, and:

* Log into Jumpcloud as an admin
* Go to "SSO Applications" under "User Authentication"
* "+ Add new application"
* Search for and select "Cognito"
* "Next"
* Display Label: Wildsea
* Description: Wildsea character sheets
* Use Portal Image: Color Indicator: Green
* Tick "Show this application in User Portal"
* You do not need to set any advanced settings
* Save Application
* Configure Application
* Modify the SP Entity IDm replacing `YOUR_USER_POOL_ID` with the id you got earlier
* In the ACS URLs, change the value to `http://<domain>/saml2/idpresponse`, using the domain you obtained earlier
* Set the Login URL to the URL of the app (see the graphql url output)
* Copy the metadata URL for later
* Go to the "User Groups" tab
* Select the user groups for access
* "Save"
* Go back to "SSO Applications" under "User Authentication", and select the "Wildsea" application
* Go to the "SSO" tab
* Under "User Attribute Mapping", add the following attributes
  * `email` = `email` (this may already be there)
  * `firstname` = `firstname`
  * `lastname` - `lastname`
* Under "Constant Attributes", add the attribute `emailVerified` = `true`
* Click "save"

In the github repo, on both the environments, set the secret `SAML_METADATA_URL`
to the URL you got earlier.

Since you require the details of the Cognito pool before creating the Jumpcloud
setup, you will need to re-run the deployment after adding the secrets.

If you do not set the secret, then Cognito will be used as the identity source.

## Development Environment

Install esbuild with `sudo npm install -g --save-exact --save-dev esbuild`

After having set up the AWS Account, use `AWS_PROFILE=<profile> make dev` to
deploy a development version. If this is a different AWS Account from the real
deployment, you will need to create an S3 bucket for the state, in the same way
as you did for the real deployment.

Development environments will not use Jumpcloud, but instead use Cognito.
