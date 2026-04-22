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
* Run `AWS_PROFILE=<profile> ./terraform/environment/github/deploy.sh <aws account id>`
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

## Troubleshooting: aws-amplify Login Breaks After Dependency Upgrade

If an automated dependency upgrade (Renovate) causes Login to fail with
"Amplify has not been configured" or "Auth UserPool not configured":

**Cause**: `aws-amplify` pins `@aws-amplify/core` to an exact version inside its
own `node_modules/`, but npm may resolve the top-level `@aws-amplify/core`
(peer dependency) to a different version. This creates two separate Amplify
singletons — `Amplify.configure()` sets one, but auth functions read the other.

**Check**: Compare the two versions:

```bash
grep '"version"' ui/node_modules/@aws-amplify/core/package.json
grep '"version"' ui/node_modules/aws-amplify/node_modules/@aws-amplify/core/package.json
```

If they differ, that is the problem.

**Fix**: Pin `@aws-amplify/core` in `ui/package.json` to the same version that
`aws-amplify` uses internally. Find that version with:

```bash
grep '"@aws-amplify/core"' ui/node_modules/aws-amplify/package.json
```

Then add it to `ui/package.json` dependencies and reinstall:

```bash
rm -rf ui/node_modules
make ui-test
```

The integration test in `ui/tests/amplifyConfig.test.ts` catches this regression
— it uses the real aws-amplify library (not mocks) and will fail if
`signInWithRedirect` throws "not configured" after `Amplify.configure()`.

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

Should return empty results. If not, those are orphaned records that didn't get
cleaned up.

### Character quotas

Deleted games don't affect quotas for other games. Each game starts fresh with
20 character slots.

## Delta Green Weapon Presets

The application supports weapon presets for Delta Green character sheets, but
the weapon data is not included in the repository.  To use weapon presets, you
must own the Delta Green Agent's Handbook and create the weapon data file
yourself.

### Adding Weapon Data

1. **For Development**: Create a file called `deltagreen-weapons.json` in the project root
2. **For Production**: Add the weapon data as a repository secret called `DELTAGREEN_WEAPONS_JSON`

The weapon data must follow the exact structure shown in
`deltagreen-weapons.example.json`. Each weapon requires:

* `display_name_*`: Display names in each language
* `weapon_data`: Object containing weapon statistics (name, baseRange, damage, etc.)
* `skillId_*`: Associated skill names in each language
* `description_*`: Weapon descriptions in each language

### Data Structure Example

```json
{
  "weapon-key": {
    "display_name_en": "Weapon Name [Category]",
    "display_name_tlh": "Klingon Translation [Category]",
    "weapon_data": {
      "name": "Weapon Name",
      "baseRange": "15m",
      "damage": "1d10",
      "armorPiercing": "N/A",
      "lethality": "N/A",
      "killRadius": "N/A",
      "ammo": "12"
    },
    "skillId_en": "Firearms 🔫",
    "skillId_tlh": "nuH 🔫",
    "description_en": "Weapon description and examples",
    "description_tlh": "Klingon description"
  }
}
```

Ensure the skill names match the names in that language from the "Skills"
section of the "Basic Agent" template.

For stat-based skills, use the format `STAT×5` (e.g., `DEX×5`, `STR×5`) which
will automatically use the corresponding stat value from the character's Stats
section. Note that stat-based weapon skills do not have a 'used' flag to tick
when failed or fumbled rolls occur.

### Production Deployment

For production deployments, you need to set up a repository secret containing the weapon data:

1. **Create the secret**: Go to repository Settings → Secrets and variables → Actions
2. **Add repository secret**: Name it `DELTAGREEN_WEAPONS_JSON`
3. **Set the value**: Paste the complete JSON weapon data (same structure as the local file)

The GitHub Actions workflow will automatically:

* Load weapon data from the `DELTAGREEN_WEAPONS_JSON` repository secret
* Write it to `deltagreen-weapons.json` before running Terraform
* Make the weapon presets available during both planning and deployment

If the secret is not set, the deployment will proceed without weapon presets (graceful degradation).

## Asset Management System

The application includes a comprehensive asset management system for handling file uploads with automatic status tracking and error handling.

For detailed sequence diagrams and architecture documentation, see [docs/README.md](docs/README.md).

### Asset Upload and Finalization Flow

#### 1. Initial Upload Flow

```plain
User initiates upload
    ↓
requestAssetUpload mutation (GraphQL pipeline resolver)
    ↓
requestAssetUpload function (DynamoDB)
    - Creates PENDING asset record in DynamoDB
    - Updates game to decrement remainingAssets
    - Updates section to add asset ID
    ↓
generatePresignedUrl function (Lambda)
    - Generates S3 presigned POST URL with upload fields
    ↓
Returns AssetUploadTicket to client
    - asset: Asset object with PENDING status
    - uploadUrl: S3 presigned POST URL
    - uploadFields: Required form fields for upload
    - headers: Metadata headers (gameId, sectionId, assetId, requestedTime)
    ↓
User uploads file to S3 using presigned POST with metadata headers
    - Upload path: incoming/game/{gameId}/section/{sectionId}/{assetId}/original
    - Metadata: x-amz-meta-gameid, x-amz-meta-sectionid, x-amz-meta-assetid, x-amz-meta-requestedtime
    - Lifecycle: incoming/ directory objects auto-delete after 1 day
```

#### 2. Automatic Finalization Flow

After S3 upload to incoming/ completes, the system automatically begins finalization:

```plain
S3 Object Created Event (s3:ObjectCreated:*)
    ↓
S3 Bucket Notification (filters for incoming/ prefix and /original suffix)
    ↓
SQS Queue (asset_uploads)
    ↓
EventBridge Pipe (asset_uploads_pipe)
    ↓
Step Function Enrichment (asset_path_parser)
    - Extracts gameId, sectionId, assetId from S3 object key
    ↓
EventBridge Custom Bus (source: "asset.uploaded", detail-type: "ObjectCreated")
    ↓
EventBridge Rule (finalise_asset_rule)
    ↓
AppSync Target → _finaliseAsset GraphQL mutation
    ↓
DynamoDB conditional update: PENDING → FINALISING
    - Only updates if status is still PENDING
    ↓
updatedAsset subscription notifies clients (FINALISING status)
```

#### 3. Asset Move Flow

When asset status changes to FINALISING, the file is moved to permanent storage:

```plain
DynamoDB Stream (detects status = FINALISING)
    ↓
EventBridge Pipe (move_asset_pipe) - filters for MODIFY + FINALISING
    ↓
Step Function (move_asset_sm) - native S3 SDK integration
    - CopyObject: incoming/ → asset/
    - DeleteObject: incoming/ (source cleanup)
    ↓
S3 object now at: asset/game/{gameId}/section/{sectionId}/{assetId}/original
```

#### 4. Automatic Promotion Flow

After file move completes, S3 event triggers asset promotion:

```plain
S3 Object Created Event (s3:ObjectCreated:*)
    ↓
S3 Bucket Notification (filters for asset/ prefix and /original suffix)
    ↓
SQS Queue (asset_promotions)
    ↓
EventBridge Pipe (asset_promotions_pipe)
    ↓
Step Function Enrichment (asset_path_parser - reused)
    - Extracts gameId, sectionId, assetId from S3 object key
    ↓
EventBridge Custom Bus (source: "asset.promoted", detail-type: "ObjectCreated")
    ↓
EventBridge Rule (promote_asset_rule)
    ↓
AppSync Target → _promoteAsset GraphQL mutation
    ↓
DynamoDB conditional update: FINALISING → READY
    - Only updates if status is still FINALISING
    ↓
updatedAsset subscription notifies clients (READY status)
```

### Asset Status Lifecycle

* **PENDING**: Asset record created, waiting for file upload
* **FINALISING**: File uploaded to incoming/, being moved to permanent storage
* **READY**: File successfully moved to asset/ directory and ready for use
* **EXPIRED**: Asset expired due to timeout (handled by separate flow)
* **CANCELED**: Asset upload was canceled (future state)

### S3 Object Key Structure

Assets follow a two-stage storage approach:

**Temporary Upload Path (incoming/):**

* `incoming/game/{gameId}/section/{sectionId}/{assetId}/original`
* Includes metadata headers: `x-amz-meta-gameid`, `x-amz-meta-sectionid`, `x-amz-meta-assetid`, `x-amz-meta-requestedtime`
* Auto-deleted after 1 day via S3 lifecycle policy
* Used during initial upload and PENDING/FINALISING states

**Permanent Storage Path (asset/):**

* `asset/game/{gameId}/section/{sectionId}/{assetId}/original`
* File is moved here when status changes to FINALISING
* Permanent storage for READY assets

This structure allows:

* Easy extraction of metadata from object headers
* Organized storage by game and section
* Automatic cleanup of abandoned uploads via lifecycle policy
* Future support for multiple file variants (thumbnails, processed versions)

### EventBridge Sources

* **asset.uploaded**: S3 object creation events from incoming/ directory (after pipe enrichment)
* **asset.promoted**: S3 object creation events from asset/ directory (after pipe enrichment)
* **wildsea.table**: DynamoDB stream events for record changes (game/player deletions, asset expirations, status changes)

### GraphQL Operations

**Mutations:**

* **requestAssetUpload**: Initiates upload process (Cognito auth)
  * Pipeline: requestAssetUpload (DynamoDB) → generatePresignedUrl (Lambda)
  * Creates PENDING asset record and returns presigned upload URL
* **_finaliseAsset**: System mutation to begin asset finalization (IAM auth only)
  * Triggered by EventBridge when S3 upload to incoming/ completes
  * Conditional update: PENDING → FINALISING
  * Triggers DynamoDB Stream event that moves file from incoming/ to asset/
* **_promoteAsset**: System mutation to mark assets as READY (IAM auth only)
  * Triggered by EventBridge when file move to asset/ completes
  * Conditional update: FINALISING → READY
* **_expireAsset**: System mutation to mark assets as EXPIRED (IAM auth only)
  * Triggered by EventBridge from DynamoDB stream when expireUploadAt is reached
  * Conditional update: PENDING → EXPIRED
* **deleteAsset**: Handles asset deletion (Cognito + IAM auth, not yet implemented)
  * Future: Will handle user-initiated deletions and cleanup

**Subscriptions:**

* **updatedAsset**: Real-time notifications for asset status changes
  * Subscribes to: `_expireAsset`, `_finaliseAsset`, `_promoteAsset`, `deleteAsset` mutations
  * Notifies clients when asset status changes (PENDING → READY, PENDING → EXPIRED, etc.)

## Scratch

⏺ S3 Event Chains with Resource Names

  1. Asset Upload Chain (Success Path)

  S3 → SQS → EventBridge Pipe → Step Function → EventBridge Bus → AppSync

  1. S3 Bucket Notification
    - Resource: aws_s3_bucket_notification.assets_events (terraform/module/wildsea/asset-bucket.tf:337)
    - Source: aws_s3_bucket.assets
    - Trigger: s3:ObjectCreated:* with filter suffix /original
    - Target: aws_sqs_queue.asset_uploads
  2. SQS Queue
    - Resource: aws_sqs_queue.asset_uploads (terraform/module/wildsea/asset-bucket.tf:289)
    - Name: ${var.prefix}-asset-uploads
  3. EventBridge Pipe
    - Resource: aws_pipes_pipe.asset_uploads_pipe (terraform/module/wildsea/asset-bucket.tf:349)
    - Name: ${var.prefix}-asset-uploads
    - Source: aws_sqs_queue.asset_uploads.arn
    - Enrichment: aws_sfn_state_machine.asset_path_parser.arn
    - Target: aws_cloudwatch_event_bus.bus.arn
  4. Step Function Enrichment
    - Resource: aws_sfn_state_machine.asset_path_parser (terraform/module/wildsea/asset-bucket.tf:377)
    - Name: ${var.prefix}-asset-path-parser
    - Extracts gameId, sectionId, assetId from S3 object key
  5. EventBridge Rule
    - Resource: aws_cloudwatch_event_rule.finalise_asset_rule (terraform/module/wildsea/deleter.tf:581)
    - Name: ${var.prefix}-finalise-asset
    - Bus: aws_cloudwatch_event_bus.bus
    - Pattern: source = ["asset.uploaded"], detail-type = ["ObjectCreated"]
  6. AppSync Target
    - Resource: aws_cloudwatch_event_target.finalise_asset_target (terraform/module/wildsea/deleter.tf:604)
    - Target ID: appsync-finalise-asset
    - GraphQL Operation: `_finaliseAsset` mutation

  Resource Flow Diagram:

  aws_s3_bucket.assets
    → aws_sqs_queue.asset_uploads
    → aws_pipes_pipe.asset_uploads_pipe
    → aws_sfn_state_machine.asset_path_parser
    → aws_cloudwatch_event_bus.bus
    → aws_cloudwatch_event_rule.finalise_asset_rule
    → aws_cloudwatch_event_target.finalise_asset_target
    → AppSync `_finaliseAsset`
