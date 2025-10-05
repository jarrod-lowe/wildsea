# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Wildsea is a serverless companion web application for tabletop RPGs (primarily
Wildsea and Delta Green). Built on AWS with React TypeScript frontend, GraphQL
API via AWS AppSync, and DynamoDB backend using single-table design.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite in `ui/`
- **Backend**: AWS AppSync GraphQL with Lambda resolvers in `graphql/`
- **Schema**: GraphQL code generation in `appsync/`
- **Infrastructure**: Terraform in `terraform/`
- **Database**: DynamoDB single-table with PK/SK pattern

## Development Commands

All make commands must be run from the root of the repository. Usually, the AWS
profile will be "wildsea".

Make sure to git checkout `main`, sync it, and create a new branch before
beginning any new work. You MUST never commit changes to `main` directly.  Do
not commit anything until after it has been tested by running `ui-local` or
pushing to the development deployment.

You will *never* need to run any command that isn't `make`. All the operations
required are in the Makefile.

### Deployment role changes deployment

IAC roles are defined in `terraform/modules/iac-roles`.

To set up the IAC roles:

- For dev: `AWS_PROFILE=wildsea make iac-dev >/dev/null`
- For prod: `AWS_PROFILE=wildsea make iac` -- you will need to enter the name of your github workspace

### Local Development

```bash
# Run UI locally against cloud backend
AWS_PROFILE=<profile> make ui-local

# Deploy development environment
# This does EVERYTHING required to fully update the dev environment, including terraform
AWS_PROFILE=<profile> make dev >/dev/null
```

The `make dev` is the only way to update the development graphql server. If any
changes where made in graphql or the resolvers, or to terraform, this will need
to be run.

### Testing

```bash
# Run UI tests
make ui-test

# Run GraphQL/backend tests  
make graphql-test
```

You cannot run node commands directly, they will not work.

### Code Quality

```bash
# Lint GraphQL code (auto-fixes outside pipeline)
make graphql-eslint

# Format Terraform
make terraform-format
```

### Building

```bash
# Build GraphQL auto-generated javascript files used by appsync query, mutations and subscriptions
# It does not deploy the API, or do anything to the query/mutation/subscription code
# To actually deploy, use AWS_PROFILE=wildsea make dev
make graphql
```

### Individual Component Commands

```bash
# GraphQL tests with coverage
cd graphql && ./node_modules/jest/bin/jest.js --coverage
```

## Key Files and Patterns

### GraphQL Resolvers

- Located in `graphql/function/`, `graphql/mutation/`, `graphql/query/`, `graphql/subscription/`
- Each resolver is a TypeScript file that builds to `appsync.js`
- Shared utilities in `graphql/lib/`
- Game type configurations in `graphql/lib/constants/gameTypes.ts`

### Database Access Patterns

- Single-table DynamoDB design with PK/SK
- GSI1 for secondary access patterns
- Entity types: Games, Players, Sections, Characters
- Utility functions in `graphql/lib/` for data marshalling

### React Components

- Main entry: `ui/src/main.tsx`
- AWS Amplify for authentication and API integration
- Uses React Router, React Intl for i18n, drag-and-drop functionality

### UI Section System

The application uses a modular section system for character sheets:

- **Section Registry**: `ui/src/sectionRegistry.tsx` maps section types to components
- **Base Section**: `ui/src/baseSection.tsx` provides common section functionality
- **Section Types**: Located in `ui/src/section*.tsx` files
  - `sectionTrackable.tsx` - Trackable items with increment/decrement
  - `sectionBurnable.tsx` - Burnable items with states
  - `sectionKeyValue.tsx` - Key/value pairs
  - `sectionRichText.tsx` - Rich text content
  - `sectionDeltaGreenStats.tsx` - Delta Green character statistics

### Adding New Section Types

1. Create new section component in `ui/src/sectionNewType.tsx`
2. Implement `SectionDefinition` interface from `baseSection.tsx`
3. Add to `sectionRegistry.tsx` with appropriate type key and seed data
4. Add translation keys to `ui/src/translations.ts`
5. For specialized sections, create custom edit forms instead of using `SectionEditForm`

### CSS and Styling

- Global styles in `ui/public/style.css`
- **Theme System**: Database-driven themes loaded dynamically via `ui/src/themeLoader.ts`
  - Theme files located in `ui/public/themes/` (wildsea.css, deltaGreen.css, default.css)
  - Themes are stored in GAMEDEFAULTS database records and loaded per game
  - Use `loadTheme(themeName)` to dynamically load CSS themes
- Uses CSS Grid for complex layouts (prefer over HTML tables)
- Section items use grid layout that may need overrides: `.section-items .custom-grid { grid-column: 1 / -1; }`
- Modern CSS patterns: `minmax()`, flexbox, grid for responsive design

### Infrastructure

- All AWS resources defined in Terraform
- Environment-specific configs in `terraform/environment/`
- Reusable modules in `terraform/module/`

The IAC roles and github setup:

- For dev: `AWS_PROFILE=wildsea make iac-dev`
- For prod: `AWS_PROFILE=wildsea make iac` -- this need the user to enter the name of your github workspace, so ask the user to run this if needed

Code is stored in github, and issues are tracked there too.

## Game Types and Configuration

The application supports multiple TTRPG systems with database-driven configuration:

- **Game Types**: Available via `getGameTypes` GraphQL query from GAMEDEFAULTS database records
- **Game Configuration**: Character names, GM names, NPCs, and themes stored in database
- **Adding New Games**: Update `terraform/module/wildsea/gamedefaults.tf` with new GAMEDEFAULTS entries
- **Theme Assignment**: Each game type has a theme field that determines CSS theme loading
- **No Hardcoded Lists**: All game type configuration is database-driven, not hardcoded in code

## Authentication

- AWS Cognito with SAML (JumpCloud) and Google OAuth2
- Multi-tenancy through game-based access control
- Cognito groups for authorization

## Testing Strategy

- **UI**: Jest + React Testing Library + jsdom environment
- **GraphQL**: Jest + ts-jest for Node.js environment
- Coverage reports generated for both frontend and backend
- Tests run in Docker containers locally, natively in CI/CD

## Development Notes

### Docker Commands

- All Docker commands in Makefiles should use `--rm` and `--user $(id -u):$(id -g)` flags
- Avoid `-it` flags in automated environments as they require interactive terminals

### Section Development

- sections are in `ui/src/section*.tsx` and `ui/src/components/*.tsx`
- Section components extend `BaseSectionItem` interface
- Use `FormattedMessage` and `useIntl` for internationalization
- Custom edit forms should be created only if the generic `SectionEditForm` will not do
- Each section has a normal/renderItems (for play) form, and an edit/renderEditForm (for edits not normally required during play) form
- Default section content should be created with appropriate `showEmpty` settings
- Things in a section that will change regularly during gameplay (e.g. HP or usages) should be able to be changed in the normal form (`renderItems`)
- Things in a section that will not change regularly during gameplay (e.g. STR, CON, ...) should only be able to be changed in the edit form (`renderEditForm`)

## Debugging and AWS Operations

You may run *read-only* `AWS_PROFILE=wildsea aws ...` commands.

When debugging issues or investigating the system state, these AWS CLI commands are useful:

### DynamoDB Operations

```bash
# Check all games in the development environment
AWS_PROFILE=wildsea aws dynamodb scan \
  --table-name Wildsea-dev \
  --filter-expression "begins_with(SK, :sk)" \
  --expression-attribute-values '{":sk":{"S":"GAME"}}' \
  --projection-expression "PK,SK,gameName,remainingCharacters"

# Check specific game records (including orphaned data)
AWS_PROFILE=wildsea aws dynamodb query \
  --table-name Wildsea-dev \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"GAME#<gameId>"}}'

# Clean up orphaned player record manually (if needed)
AWS_PROFILE=wildsea aws dynamodb delete-item \
  --table-name Wildsea-dev \
  --key '{"PK":{"S":"GAME#<gameId>"},"SK":{"S":"PLAYER#<userId>"}}'
```

### Step Function Operations

```bash
# Check recent Step Function executions for game deletion cleanup
AWS_PROFILE=wildsea aws stepfunctions list-executions \
  --state-machine-arn "arn:aws:states:ap-southeast-2:021891603679:stateMachine:Wildsea-dev-delete-player" \
  --max-items 5

# Get details of a specific execution (to debug failures)
AWS_PROFILE=wildsea aws stepfunctions describe-execution \
  --execution-arn "arn:aws:states:ap-southeast-2:021891603679:execution:Wildsea-dev-delete-player:<execution-id>"
```

### EventBridge Operations

```bash
# List EventBridge rules for the wildsea-dev bus
AWS_PROFILE=wildsea aws events list-rules --event-bus-name "Wildsea-dev"
```

### AppSync Logs

```bash
# Check AppSync logs for GraphQL errors or subscription issues
AWS_PROFILE=wildsea aws logs filter-log-events \
  --log-group-name "/aws/appsync/apis/5h5wrzbmlnbx7coplrn53gb5xq" \
  --start-time <timestamp> \
  --filter-pattern "deletePlayer"
```

### Common Investigation Patterns

**Game deletion not cleaning up properly:**

1. Check if Step Function executed: `aws stepfunctions list-executions`
2. Check if EventBridge events were sent: Look at Step Function execution details
3. Check if deletePlayer mutations succeeded: AppSync logs
4. Manually verify cleanup: DynamoDB query for remaining records

**Character quota not updating:**

1. Check GraphQL subscriptions are working: AppSync logs
2. Verify remainingCharacters field exists: DynamoDB scan
3. Check UI subscription handlers: Browser console

**Database migration verification:**

```bash
# Count games missing remainingCharacters field
AWS_PROFILE=wildsea aws dynamodb scan \
  --table-name Wildsea-dev \
  --filter-expression "begins_with(SK, :sk) AND attribute_not_exists(remainingCharacters)" \
  --expression-attribute-values '{":sk":{"S":"GAME"}}'
```

## Assets

Any changes to the asset flows should update the README.md and docs/*.mmd (even
adding a new diagram if necessary). Remake the SVGs with `make diagrams`.
