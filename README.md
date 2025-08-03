# Wildsea

Wildsea companion app

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/31f30fef56544a3c931c56da17afc2e9)](https://app.codacy.com/gh/jarrod-lowe/wildsea/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/31f30fef56544a3c931c56da17afc2e9)](https://app.codacy.com/gh/jarrod-lowe/wildsea/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)

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
* Create a route53 hosted zone, enable DNSSEC, and perform the necessary delegations
* Create an S3 bucket `terraform-state-<accountid>`
* Create `terraform/environment/aws/terraform.tfvars`
  * Add `workspace = "<your github org>"` to the vars file
* Create `terraform/environment/wildsea-dev/terraform.tfvars`
  * Add `domain = "<domain>"` to the route53 zone domain name
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
* In codacy, go to the repo -> settings -> coverage and copy the repository API token
* Log into Github and create a personal access token with the "repo" scope, and 7 days expiry
* Create `terraform/environment/github/terraform.tfvars`
  * Add `token = "<the token>"` to the vars file
  * Add `workspace = "<your github org>"` to the vars file
  * Add `codacy_api_token = "<the token>"` to the vars file
* Run `.AWS_PROFILE=<profile> ./terraform/environment/github/deploy.sh <aws account id>`
* Install <https://github.com/apps/renovate> into the repo
* Go into the two environments, and set a secret called `SAML_METADATA_URL` with the metadata URL for you SAML (See Jumpcloud for an example)
* Go into the two environments, and set a variable `DOMAIN_NAME` with the DNS zone set up earlier

To automate:

* In Github, Under settings, "Set up code scanning"
  * Enable everything except Dependabot version updates
  * Set up CodeQL to default
  * Set the Protection rules to Any/Any

To set up the IAC roles:

* For dev: `AWS_PROFILE=wildsea make iac-dev`
* For prod: `AWS_PROFILE=wildsea make iac` -- you will need to enter the name of your github workspace

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

## Google OAUTH2 Integration

* Go to <https://console.developers.google.com>
* Create a new projects "wildsea-dev" and "wildsea"
* Go to each new project and:
  * Go rto "OAuth consent screen"
  * Select "External" and "Create"
  * App Name = "Wildsea" (or "Wildsea (dev)")
  * User support email = yourself
  * App Logo: TODO
  * App domain homepage = <https://YOURDOMAIN> or <https://wildsea-dev.YOURDOMAIN>
  * Set the privacy policy link and terms of service link to the same url + '/tos.html'
  * Add an authorised domain of the top level of YOURDOMAIN
  * Add an authorised domain of the top level of "amazoncognito.com"
  * Add an appropriate email for contact info
  * Save
  * Add the scope "openid", Update and Save & Continue
  * Add your test users and Save and Continue
  * Back to dashboard
  * Go to "Credentials", and "Create Credentials", then "OAuth Client ID"
  * Name it "wildsea" or "wildsea-dev"
  * For the authorised javascript origins, add your cognito url available from the app integration page of the user pool - e.g. <https://yourDomainPrefix.auth.region.amazoncognito.com> (If it is not set up yet, add a dummy value and come back and change this later)
  * Set the authorised redirect URIs to the same URL, with `/oauth2/idpresponse` added onto the end
  * Create
  * For dev: Add the client ID and client secret to `terraform/environment/wildsea-dev/terraform.tfvars` as `google_client_id` and `google_client_secret`
  * For primary: Add the client ID and client secret as secrets in the github environments, as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  * TODO: Publish App

## Development Environment

Install esbuild with `sudo npm install -g --save-exact --save-dev esbuild`

Create `terraform/environment/wildsea-dev/terraform.tfvars`, and add to it:

* `domain_name = "<domain name>"` - the DNS zone for the test site
* If you want to use Google for logins, set `google_client_id` and `google_client_secret`

After having set up the AWS Account, use `AWS_PROFILE=<profile> make dev` to
deploy a development version. If this is a different AWS Account from the real
deployment, you will need to create an S3 bucket for the state, in the same way
as you did for the real deployment.

Development environments will not use Jumpcloud, but instead use Cognito.

You can run the UI without pushing to the S3 bucket by running
`AWS_PROFILE=<profile> make ui-local`. This may still perform a terraform
apply.

## Game Deletion

When a game is deleted, the system cleans up all related data automatically.

### What happens

1. **User deletes game** - Only the game owner can do this
2. **Main game record deleted** - Game disappears immediately 
3. **Background cleanup starts** - All player characters and sections get deleted automatically
4. **Users get notified** - Anyone in the game gets redirected to the main page

### Background process

The cleanup happens automatically using:

* DynamoDB streams detect the game deletion
* Step Function finds all characters in that game  
* Each character gets deleted (including all their character sheet sections)
* Takes a few seconds to complete

### If something goes wrong

Check for leftover records:
```bash
AWS_PROFILE=wildsea aws dynamodb query \
  --table-name Wildsea-dev \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"GAME#<gameId>"}}'
```

Should return empty results. If not, those are orphaned records that didn't get cleaned up.

### Character quotas

Deleted games don't affect quotas for other games. Each game starts fresh with 20 character slots.
