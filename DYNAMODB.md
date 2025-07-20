# DynamoDB Table Structure

This document describes the DynamoDB table structure used by the Wildsea TTRPG application, including entity types, access patterns, and how they map to GraphQL operations.

## Table Configuration

### Main Table
- **Table Name**: `Wildsea-{environment}` (e.g., `Wildsea-dev`, `Wildsea-prod`)
- **Billing Mode**: Pay-per-request (on-demand)
- **Primary Key**: 
  - **Hash Key (PK)**: String - Partition key for data distribution
  - **Range Key (SK)**: String - Sort key for ordering within partition
- **Features**:
  - DynamoDB Streams enabled with `OLD_IMAGE` view type
  - Point-in-time recovery enabled
  - Deletion protection enabled

### Global Secondary Index (GSI1)
- **Index Name**: GSI1
- **Hash Key**: `GSI1PK` (String) - Enables reverse lookups
- **Range Key**: `PK` (String) - Uses main table's partition key as sort key
- **Projection**: ALL attributes
- **Purpose**: User-centric queries (find all games/sections for a user)

## Entity Types

The application uses a single-table design with the following entity types:

| Entity Type | Description | Storage |
|-------------|-------------|---------|
| `GAME` | Game instances/sessions | Persistent |
| `CHARACTER` | Player characters | Persistent |
| `SECTION` | Character sheet sections | Persistent |
| `FIREFLY` | Game masters/handlers | Persistent |
| `SHIP` | NPCs/ships (Wildsea game type) | Persistent |
| `TEMPLATE` | Character sheet templates | Persistent |
| `DICEROLL` | Dice roll events | Subscription-only, not stored |

## Key Patterns

### Primary Table (PK/SK)

#### Game Records
```
PK: GAME#{gameId}
SK: GAME
```
**Attributes**: `gameName`, `gameDescription`, `gameType`, `players` (StringSet), `createdAt`, etc.

#### Player/Character Records
```
PK: GAME#{gameId}
SK: PLAYER#{userId}
```
**Attributes**: `characterName`, `userEmail`, `type` (CHARACTER/FIREFLY/SHIP), `sections` (StringSet), etc.

#### Section Records
```
PK: GAME#{gameId}
SK: SECTION#{sectionId}
```
**Attributes**: `sectionName`, `sectionType`, `content` (JSON), `position`, `userId`, etc.

#### Template Records
```
PK: TEMPLATE#{gameType}#{language}
SK: TEMPLATE#{templateName}
```
**Attributes**: `templateName`, `displayName`, `gameType`, `language`, `sections` (JSON array), etc.

### GSI1 (GSI1PK/PK)

#### User's Games Lookup
```
GSI1PK: USER#{userId}
PK: GAME#{gameId}
```
**Purpose**: Find all games a user participates in

#### User's Sections Lookup
```
GSI1PK: SECTIONUSER#{userId}
PK: GAME#{gameId}
```
**Purpose**: Find all sections owned by a user within a game

## Access Patterns

### Game Operations

#### Query: `getGame(gameId: String!)`
**Access Pattern**: Query main table
```
PK = GAME#{gameId}
```
**Returns**: All entities for a game (game record + all players + all sections)

**Implementation**: `graphql/function/getGame/getGame.ts`

#### Query: `getGames`
**Access Pattern**: Query GSI1
```
GSI1PK = USER#{userId}
```
**Returns**: All games where the user is a participant

**Implementation**: `graphql/query/getGames/getGames.ts`

#### Mutation: `createGame(input: CreateGameInput!)`
**Access Pattern**: TransactWriteItems
1. Create game record: `PK=GAME#{gameId}, SK=GAME`
2. Create firefly/handler record: `PK=GAME#{gameId}, SK=PLAYER#{userId}` with `GSI1PK=USER#{userId}`
3. Create default NPCs (based on game type)

**Implementation**: `graphql/mutation/createGame/createGame.ts`

#### Mutation: `deleteGame(gameId: String!)`
**Access Pattern**: Query + BatchWriteItems
1. Query all entities: `PK = GAME#{gameId}`
2. Batch delete all found items

**Implementation**: `graphql/mutation/deleteGame/deleteGame.ts`

### Player Operations

#### Mutation: `joinGame(input: JoinGameInput!)`
**Access Pattern**: TransactWriteItems
1. Update game record to add player to `players` StringSet
2. Create player record: `PK=GAME#{gameId}, SK=PLAYER#{userId}` with `GSI1PK=USER#{userId}`

**Implementation**: `graphql/function/joinGame/joinGame.ts`

#### Mutation: `updatePlayer(input: UpdatePlayerInput!)`
**Access Pattern**: UpdateItem
```
PK = GAME#{gameId}
SK = PLAYER#{userId}
```

**Implementation**: `graphql/function/updatePlayer/updatePlayer.ts`

#### Mutation: `deletePlayer(input: DeletePlayerInput!)`
**Access Pattern**: Query + conditional operations
1. Find player: `PK=GAME#{gameId} AND begins_with(SK, PLAYER#)`
2. Handle section ownership transfer
3. Delete player record

**Implementation**: `graphql/function/deletePlayer/deletePlayer.ts`

### Section Operations

#### Mutation: `createSection(input: CreateSectionInput!)`
**Access Pattern**: PutItem
```
PK = GAME#{gameId}
SK = SECTION#{sectionId}
GSI1PK = SECTIONUSER#{userId}
```

**Implementation**: `graphql/function/createSection/createSection.ts`

#### Mutation: `updateSection(input: UpdateSectionInput!)`
**Access Pattern**: UpdateItem
```
PK = GAME#{gameId}
SK = SECTION#{sectionId}
```

**Implementation**: `graphql/function/updateSection/updateSection.ts`

#### Mutation: `deleteSection(input: DeleteSectionInput!)`
**Access Pattern**: DeleteItem + update player sections
```
PK = GAME#{gameId}
SK = SECTION#{sectionId}
```

**Implementation**: `graphql/function/deleteSection/deleteSection.ts`

#### Internal: Find All Sections for User
**Access Pattern**: Query GSI1
```
GSI1PK = SECTIONUSER#{userId}
PK = GAME#{gameId}
```

**Implementation**: `graphql/function/findAllSections/findAllSections.ts`

### Template Operations

#### Query: `getCharacterTemplates(input: GetCharacterTemplatesInput!)`
**Access Pattern**: Query main table
```
PK = TEMPLATE#{gameType}#{language}
```
**Returns**: Template metadata only (templateName, displayName)

**Implementation**: `graphql/query/getCharacterTemplates/getCharacterTemplates.ts`

#### Query: `getCharacterTemplate(input: GetCharacterTemplateInput!)`
**Access Pattern**: GetItem
```
PK = TEMPLATE#{gameType}#{language}
SK = TEMPLATE#{templateName}
```
**Returns**: Full template content with sections

**Implementation**: `graphql/query/getCharacterTemplate/getCharacterTemplate.ts`

## Subscriptions

### Real-time Updates
The application supports real-time updates through GraphQL subscriptions backed by DynamoDB Streams:

#### `updatedGame(gameId: String!)`
**Trigger**: Any change to items with `PK = GAME#{gameId}`
**Implementation**: `graphql/subscription/updatedGame/updatedGame.ts`

#### `updatedPlayer(gameId: String!)`
**Trigger**: Changes to player records (`SK = PLAYER#{userId}`)
**Implementation**: `graphql/subscription/updatedPlayer/updatedPlayer.ts`

#### `updatedSection(gameId: String!)`
**Trigger**: Changes to section records (`SK = SECTION#{sectionId}`)
**Implementation**: `graphql/subscription/updatedSection/updatedSection.ts`

#### `diceRolled(gameId: String!)`
**Trigger**: Dice roll mutations (ephemeral, not stored)
**Implementation**: `graphql/subscription/diceRolled/diceRolled.ts`

## Game Type Configuration

The system supports multiple TTRPG systems with different characteristics:

### Supported Game Types
- **Wildsea**: Post-apocalyptic surreal RPG
  - Default NPC: "Unnamed Ship"
  - Firefly character name: "Firefly"
- **Delta Green**: Modern horror investigation RPG
  - No default NPCs
  - Handler character name: "Handler"

### Default Configuration
- **Default Game Type**: `deltaGreen`
- **Template Language**: `en` (English)

Configuration defined in: `graphql/lib/constants/gameTypes.ts`

## Data Relationships

The single-table design efficiently models these relationships:

### One-to-Many
- **Game → Players**: Partitioned by `PK = GAME#{gameId}`
- **Game → Sections**: Partitioned by `PK = GAME#{gameId}`
- **User → Sections**: Via GSI1 lookup

### Many-to-Many
- **Users ↔ Games**: Via GSI1 with `GSI1PK = USER#{userId}`

### Hierarchical
- **Templates → Sections**: JSON structure within template record
- **Characters → Sections**: StringSet reference in player record

## Security and Authorization

### Access Control Patterns
1. **User Identity**: Cognito JWT token validation
2. **Game Membership**: Verified through player records
3. **Section Ownership**: Enforced via `userId` attribute
4. **Game Master Privileges**: Firefly/Handler type checking

### Conditional Expressions
- Section updates require ownership or game master status
- Game deletion requires firefly/handler privileges
- Player removal handled by game masters

### Data Privacy
- Game partitioning ensures data isolation
- User-specific queries via GSI1 prevent unauthorized access
- Section content is opaque JSON (application-level validation)

## Performance Considerations

### Hot Partitions
- Game partitions can become hot with many concurrent players
- Sections are distributed across game partitions
- Templates use separate partitions by game type and language

### Query Efficiency
- Single-partition queries for game data retrieval
- GSI1 enables efficient user-centric operations
- Batch operations minimize round trips for game setup/teardown

### Cost Optimization
- Pay-per-request billing suits variable workloads
- Single table reduces overhead
- Efficient access patterns minimize read/write units

## Migration and Schema Evolution

### Backward Compatibility
- JSON content fields allow schema evolution
- Entity type versioning through attribute presence
- Template structure can evolve independently

### Data Migration Patterns
- Stream-based migrations for large datasets
- Conditional updates for schema changes
- Template versioning for character sheet evolution

---

**File Locations**:
- Entity types: `graphql/lib/constants/entityTypes.ts`
- DB prefixes: `graphql/lib/constants/dbPrefixes.ts`
- Game types: `graphql/lib/constants/gameTypes.ts`
- Table definition: `terraform/module/wildsea/main.tf`