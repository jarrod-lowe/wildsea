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

### Local Development

```bash
# Run UI locally against cloud backend
AWS_PROFILE=<profile> make ui-local

# Deploy development environment
AWS_PROFILE=<profile> make dev
```

### Testing

```bash
# Run UI tests
make ui-test

# Run GraphQL/backend tests  
make graphql-test

# Run all tests
make ui-test graphql-test
```

### Code Quality

```bash
# Lint GraphQL code (auto-fixes outside pipeline)
make graphql-eslint

# Format Terraform
make terraform-format
```

### Building

```bash
# Build GraphQL resolvers
make graphql

# Build UI for specific environment
make ui/.build-dev
make ui/.build-prod
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
- Uses CSS Grid for complex layouts (prefer over HTML tables)
- Section items use grid layout that may need overrides: `.section-items .custom-grid { grid-column: 1 / -1; }`
- Modern CSS patterns: `minmax()`, flexbox, grid for responsive design

### Infrastructure

- All AWS resources defined in Terraform
- Environment-specific configs in `terraform/environment/`
- Reusable modules in `terraform/module/`

## Game Types

The application supports multiple TTRPG systems with specific character types
and default NPCs configured in `gameTypes.ts`. When adding new game support,
update this configuration file.

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

- Section components extend `BaseSectionItem` interface
- Use `FormattedMessage` and `useIntl` for internationalization
- Custom edit forms should be created if the generic `SectionEditForm` will not do
- Default section content should be created with appropriate `showEmpty` settings
- Things in a section that will change regularly during gameplay (e.g. HP or usages) should be able to be changed in the normal form (`renderItems`)
- Things in a section that will not change regularly during gameplay (e.g. STR, CON, ...) should only be able to be changed in the edit form (`renderEditForm`)
