# Wildsea App

I am creating a web-app and backend service to act as a companion app for the
TTRPG game Wildsea. It will support multiple games, each of which has a
"firefly" (the GM user) and players. Each player in a game would have a player
sheet. There will also be a ship sheet, a clocks page, and a dice roller.

The data will be stored in dynamodb, using single table design. The API will use
GraphQL.

## Definitions

A "track" is a number of dots that can be marked off in a couple of ways. For
example, a 4-track would start out with four unselected dots - think "O O O O".
After a while, one of those might be marked, making it "/ O O O". After some
more time, another might get marked ("/ / O O"), and then one gets cleared
("/ O O O"). One might then get "burnt" ("X / O O"). Followed later by another
being marked ("X / / O"). Maybe after that, the burnt dot will be repaired
("/ / O O").

A "level" is similar to a track, but doesn't have the concept of being burnt. A
3-level which is currently set to 2 would look like "X X O". A specific level
might have special names for have 0, 1, 2... dots selected - see additional
data.

A "clock" is a number of dots and seperators that can be marked off. For
example, a 4,2,2-clock would look like "O O O O | O O | O O". The seperator
indicates a significant event that occurs when the clock reaches that point.
Over time, the clock will be filled in - so an occurence in the game might mark
three dots, taking it to "X X X O | O O | O O".

For tracks, levels, and clocks, any player who can write to that field can mark
or unmark (and if appropriate, burn or unburn) dots on the track/level/clock.

## Data Objects

Here are the type of data objects the service will need to handle:

### User

A user is an identity for a real human. Each user can be in multiple games, and
in any game could be the firefly (GM) or a player with a player character.

A user has the following properties:

* A name

A user will be linked to a Cognito login.

### Game

A game has a few properties and linkages:

* A name
* A description
* Public Notes (readable by players and the firefly)
* Private Notes (readable only by the firefly)
* A Firefly User (a user object)
* A number of player users, each with a player sheet
* A ship sheet
* A number of clocks

### Player Sheet

A player sheet is owned by a user, and is in one and only one game. The owning
player and the firefly for this game can read and write the player sheet. Other
players in the game can read the player sheet - except where noted.

A player sheet as a number of properties and linkages:

* A User who owns the sheet
* The game the player sheet is in
* A character name
* Pronouns
* A Bloodline
* An Origin
* A Post
* Public Notes
* Private Notes (not visible to other players in the game)
* Secret Notes (not visible to other players in the game, or the firefly of the game)
* Firefly Notes (not visible to any players in the game - just for the firefly)
* 0+ Milestones, each of which has:
  * A Type: Major or Minor
  * A Description
* A number of Drives (each of which is free-form text)
* A number of Mires, each of which has:
  * A Description
  * Notes
  * A 2-level
* A list of Edges, containing:
  * A name
  * A description
* A list of skills, containing:
  * A name
  * A description
  * A 3-level
* A list of languages, containing:
  * A name
  * A description
  * A 3-level
* 0+ Resources, containing:
  * A Type: Salvage, Specimens, Whispers, or Charts
  * A description
  * A number of tags
* A number of aspects, containing:
  * A name
  * A Type: Trait, Gear, or Companion
  * A track, of a configurable length
  * A description
* A number of Temporary Tracks, containing:
  * A name
  * A Type; Benefit, Injury, or Track
  * A track, of a configurable length
  * A description

### Ship Sheet

A Game may have 0+ Ships. A ship exists in only one game. Each Ship has a Ship
Sheet. All players and the firefly can read and write the ship sheet, except
where noted.

A ship sheet has a number of properties and linkages:

* A name
* Public Notes
* GM Notes (readable and writeable only by the firefly for the game)
* A set of conditions (e.g; Damaged, Pretty)
* Stakes Used (an int) and Stakes Total (an int)
* A set of six ratings, containing:
  * A name, from a pre-defined list
  * A 6-track
* The Design, with:
  * Size
  * Frame
  * Hull
  * Bite
  * Engine
* Fittings, with:
  * 0+ Motifs
  * 0+ Additions
  * 0+ Rooms
  * 0+ Armaments
  * 0+ Outriders
* 0+ Undercrew, with:
  * A Name
  * A Type: Officer, Gang, or Pack
  * A configurable track
  * A description
* 0+ Reputation, with:
  * A name
  * A 3-track
* 0+ Cargo
* 0+ Passengers

### Clocks

A Firefly can create any number if clocks, of any lengths they like. They can define:

* A name
* The lengths of the clock
* The visibility of the clock
* GM Notes (visible only to the GM)

The options for visibility are:

* Public - any player in the game can see them
* Hidden - only the firefly can see them

### Dice Roller

There will be a dice roller. At any point, any player in a game, or the firefly
of the game, can choose to roll some dice. We will record only the last 40 dice
rolls per game.

On a roll, the player or firefly rolling selects the number of dice to roll, and
the number of dice to cut. The back-end system will:

* Produce a random number between 1 and 6 (inclusive) for each of the dice to roll
* Sort them highest to lowest
* Drop the highest N results, where N is the number of the cut
* Take the highest remaining value, and report that back
* If there are any doubles in the non-cut dice, it will report that there is a "twist"

The data stored for a dice roll is:

* The nane of the player character (from the character sheet) who rolled the dice
* The number rolled
* The number cut
* The reported result value
* Whether or not there was a twist
* The sorted values of all the dice rolled

## Additional Data

### Mires

A mire level would be named "Unafraid" (for zero dots), "Afraid" (for one dot)
or "Terrified" (for two dots).

### Edges

Each Edge has a detailed description, but for the eight standard Edges, it is
the same for all uses of that edge. For example, the edge "Grace", the
description is "*An edge of elegance, precision, & agility*; You’re at your best
when you’re free to move, using superior mobility and unexpected speed to run
rings around a problem. Grace gives you the edge when dodging and balancing,
performing acrobatic feats, and attacking with lighter weapons."

There are eight edges available by default, and will be used when editing the
list of edges to suggest possible new ones for the player sheet, but the player
may also define their own, or use a standard one and then modify it.

### Skills

Each skill has a detailed description, but for the standard eighteen, it is the
same for all uses of that skill.

There are eighteen skills available by default, and will be used when editing
the list of skills to suggest new possible ones for the player sheet, but the
player may also define their own, or use a standard one and then modify it.

The skill level names are "Rank 0", "Rank 1", "Rank 2" and "Rank 3".

### Languages

Each language has a detailed description, but for the standard eleven, it is the
same for all uses of that language.

There are eleven languages available by default, and will be used when editing
the list of languages to suggest new possible ones for the player sheet, but the
player may also define their own.

The language level names are "Unfamiliar", "Smattering", "Knowledge", and
"Fluency".

### Resources

There will be a set of standard resources that users can look up when editing
their player sheets, but they can also create their own, or use a standard one
and then modify it.

### Aspects

There will be a set of standard aspects that users can look up when editing
their player sheets, but they can also create their own, or use a standard one
and then modify it.

### Ratings

There are six defined ratings - Armour, Seals, Soeed, Saws, Stealth, and Tilt.
Each ship has exactly those six ratings.

### Design

For each type of design (Motif, Additons, etc), there will be a list of standard
ones that can be used by a player editing a ship, but they can add their own, or
use a standard one and then modify it.

### Undercrew

For each undercrew, there will be a standard list (inluding the name, type,
length of track, and description) that can be used by a player editing the ship
sheet, but they can create their own, or use a standard one and then modify it.

## Your task

Claude, I want you to help me design the dynamodb table design, using the
principals of single table design. As a first step, please lay out the data
access patterns - the updates and queries we will need to make on the tables.

Then, propose the table design. Describe each record type we would store in the
table, along with how we would pack ("FOO#BAR#whatever") data into the partition
and sort keys of the primary key, LSIs, and GSIs. Also describe what the other
fields would be.

Also list all the LSIs and GSIs required.

## DynamoDB Table Design

Assistant:

### Table Design

**Table Name:** `wildsea`

**Partition Key (PK):** `PK` (String)
**Sort Key (SK):** `SK` (String)

### Record Types**

1. **User**
   * `PK`: `USER#<userId>`
   * `SK`: `METADATA`
   * Other fields: `name`, `createdAt`, `updatedAt`

2. **Game**
   * `PK`: `GAME#<gameId>`
   * `SK`: `METADATA`
   * `gameId`: gameId
   * Other fields: `gameName`, `gameDescription`, `publicNotes`, `privateNotes`, `fireflyUserId`, `createdAt`, `updatedAt`, `GSI1PK`

3. **GM Info**
   * `PK`: `GAME#<gameId>`
   * `SK`: `PLAYER#GM#<userId>`
   * `GSI1PK`: `USER#<userId>`
   * `userId`: userId
   * `gameId`: gameId
   * gameName and gameDescription: Duplicated from game

4. **Player Sheet**
   * `PK`: `GAME#<gameId>`
   * `SK`: `PLAYER#PC#<userId>`
   * `GSI1PK`: `USER#<userId>`
   * `userId`: userId
   * `gameId`: gameId
   * `characterName` (String)
   * `pronouns` (String)
   * `bloodline` (String)
   * `origin` (String)
   * `post` (String)
   * `publicNotes` (String)
   * `privateNotes` (String)
   * `secretNotes` (String)
   * `fireflyNotes` (String)
   * `milestones` (List of Maps)
        * Each map in the list represents a milestone and contains fields like `type` (String: "Major" or "Minor"), `description` (String)
   * `drives` (List of Strings)
   * `mires` (List of Maps)
        * Each map in the list represents a mire and contains fields like `description` (String), `notes` (String), `level` (Number: 0, 1, or 2)
   * `edges` (List of Maps)
        * Each map in the list represents an edge and contains fields like `name` (String), `description` (String)
   * `skills` (List of Maps)
        * Each map in the list represents a skill and contains fields like `name` (String), `description` (String), `level` (Number: 0, 1, 2, or 3)
   * `languages` (List of Maps)
        * Each map in the list represents a language and contains fields like `name` (String), `description` (String), `level` (Number: 0, 1, 2, or 3)
   * `resources` (List of Maps)
        * Each map in the list represents a resource and contains fields like `type` (String: "Salvage", "Specimens", "Whispers", or "Charts"), `description` (String), `tags` (List of Strings)
   * `aspects` (List of Maps)
        * Each map in the list represents an aspect and contains fields like `name` (String), `type` (String: "Trait", "Gear", or "Companion"), `track` (Map with fields like `length` (Number) and `currentValue` (Number)), `description` (String)
   * `temporaryTracks` (List of Maps)
        * Each map in the list represents a temporary track and contains fields like `name` (String), `type` (String: "Benefit", "Injury", or "Track"), `track` (Map with fields like `length` (Number) and `currentValue` (Number)), `description` (String)
   * Other fields: `createdAt`, `updatedAt`
   * gameName and gameDescription: Duplicated from game

5. **Ship Sheet**
   * `PK`: `GAME#<gameId>`
   * `SK`: `SHIP#<shipId>`
   * `name` (String)
   * `publicNotes` (String)
   * `gmNotes` (String)
   * `conditions` (List of Strings)
   * `stakesUsed` (Number)
   * `stakesTotal` (Number)
   * `ratings` (List of Maps)
        * Each map in the list represents a rating and contains fields like `name` (String: "Armour", "Seals", "Speed", "Saws", "Stealth", or "Tilt"), `track` (Map with fields like `length` (Number) and `currentValue` (Number))
   * `design` (Map)
        * Contains fields like `size` (String), `frame` (String), `hull` (String), `bite` (String), `engine` (String)
   * `fittings` (Map)
        * Contains fields like `name` (String), `description` (String) and  `type` (String)
        * The possible types will be in `SEED#FITTINGSTYPES`
   * `undercrew` (List of Maps)
        * Each map in the list represents an undercrew and contains fields like `name` (String), `type` (String: "Officer", "Gang", or "Pack"), `track` (Map with fields like `length` (Number) and `currentValue` (Number)), `description` (String)
   * `reputation` (List of Maps)
        * Each map in the list represents a reputation and contains fields like `name` (String), `track` (Map with fields like `length` (Number) and `currentValue` (Number))
   * `cargo` (List of Strings)
   * `passengers` (List of Strings)
   * Other fields: `createdAt`, `updatedAt`

6. **Clock**
   * `PK`: `GAME#<gameId>`
   * `SK`: `CLOCK#<clockId>`
   * Other fields: `name`, `lengths`, `visibility`, `gmNotes`, `createdAt`, `updatedAt`

7. **Dice Roll**
   * `PK`: `GAME#<gameId>`
   * `SK`: `DICEROLL#<timeSortableGuid>`
   * Other fields: `playerCharacterName`, `numRolled`, `numCut`, `result`, `twist`, `rollValues`, `createdAt`

8. **Seed Data**
   * `PK`: `SEED#<type>`
   * `SK`: `<id>`
   * Other fields: vary based on the type, e.g., `name`, `description`, `trackLength`, etc.
   * `<type>`'s include: `MIRE`, `EDGE`, `SKILL`, `LANGUAGE`, `RESOURCE`, `ASPECT`, `RATING`, `DESIGN`, `UNDERCREW`, `FITTINGTYPE`

9. **Level Name**
   * `PK`: `LEVELNAME#<type>`
   * `SK`: `<numDots>`
   * Other fields: `name`
   * `<type>`'s include: `SKILL`, `LANGUAGE`, `MIRE`, `DICEROLL`

### Local Secondary Indexes (LSIs)

No LSIs are required for this table design.

### Global Secondary Indexes (GSIs)

1. **GSI1: UserGameIndex**
   * Partition Key: `GSI1PK` (String)
   * Sort Key: `GSI1SK` (String)
   * For GM or Player Sheet records:
       * `GSI1PK`: `USER#<userId>`
       * The GSI SK is `PK`
   * This index allows us to query all games where the user is a firefly or player.

In this updated design, we have two generic record types:

1. **Seed Data**
   * `PK`: `SEED#<type>`
   * `SK`: `<id>`
   * This record type stores the seed data for various entities like mires, edges, skills, languages, resources, aspects, ratings, designs, and undercrews. The `<type>` in the partition key represents the specific entity type (e.g., `MIRE`, `EDGE`, `SKILL`, etc.), and the `<id>` in the sort key is a unique identifier for the specific seed data item.

2. **Level Name**
   * `PK`: `LEVELNAME#<type>`
   * `SK`: `<numDots>`
   * Other fields: `<numDots>DotsName`
   * This record type stores the level names for entities that have a numeric level or number of dots marked. The `<type>` in the partition key represents the specific entity type (e.g., `SKILL`, `LANGUAGE`, `MIRE`, etc.), and the `<numDots>` in the sort key represents the number of dots marked (0, 1, 2, 3, etc.).

With this more concise documentation, we can easily understand the structure and purpose of these generic record types, while still maintaining the flexibility to store different types of data within them.

Please let me know if this updated table design and explanation make sense or if you have any further questions or concerns.

Sure, here's a list of all the queries and updates we can perform with the updated table design:

### Queries

1. **Get all games for a user (as a player)**
   * Query on GSI1: `GSI1PK = USER#<userId>`

2. **Get all games for a user (as a firefly)**
   * Query on GSI2: `GSI2PK = USER#<userId>`

3. **Get all player sheets for a game**
   * Query: `PK = GAME#<gameId> and SK begins with PLAYER#`

4. **Get a specific player sheet for a user in a game**
   * Query: `PK = GAME#<gameId> and SK = PLAYER#<userId>`

5. **Get the ship sheet for a game**
   * Query: `PK = GAME#<gameId> and SK = SHIP#<shipId>`

6. **Get all clocks for a game**
   * Query: `PK = GAME#<gameId> and SK begins with CLOCK#`

7. **Get dice roll history for a game**
   * Query: `PK = GAME#<gameId> and SK begins with DICEROLL#`

8. **Get seed data for a specific type (e.g., mires, edges, skills, etc.)**
   * Query: `PK = SEED#<type>`

9. **Get level name for a specific type and number of dots (e.g., skill level for 2 dots, language level for 0 dots, etc.)**
   * Query: `PK = LEVELNAME#<type> and SK = <numDots>`

### Updates

1. **Create/Update a user**
   * Write a User record with the appropriate `PK` and `SK`

2. **Create/Update a game**
   * Write a Game record with the appropriate `PK` and `SK`
   * Update the `GSI2PK` and `GSI2SK` fields with the firefly user ID and game ID

3. **Create/Update a player sheet**
   * Write a Player Sheet record with the appropriate `PK` and `SK`
   * Update the `GSI1PK` and `GSI1SK` fields with the user ID and game ID

4. **Update the ship sheet**
   * Write a Ship Sheet record with the appropriate `PK` and `SK`

5. **Create/Update a clock**
   * Write a Clock record with the appropriate `PK` and `SK`

6. **Record a dice roll**
   * Write a Dice Roll record with the appropriate `PK` and `SK` (using a time-sortable GUID)

7. **Create/Update seed data for a specific type (e.g., mires, edges, skills, etc.)**
   * Write a Seed Data record with `PK = SEED#<type>` and an appropriate `SK`

8. **Create/Update level name for a specific type and number of dots (e.g., skill level for 2 dots, language level for 0 dots, etc.)**
   * Write a Level Name record with `PK = LEVELNAME#<type>` and `SK = <numDots>`

Human:

## GraphQL

Claude, now I would like you to design a GraphQL schema, suitable for use with
AWS AppSync, to support the quiries and updates with that data.

## GraphQL Design

Assistant:

```graphql
input CreateUserInput {
  name: String!
}

input UpdateUserInput {
  name: String
}

input CreateGameInput {
  name: String!
  description: String
  publicNotes: String
  privateNotes: String
  fireflyUserId: ID!
  players: [ID!]!
}

input UpdateGameInput {
  name: String
  description: String
  publicNotes: String
  privateNotes: String
  players: [ID!]
}

input CreatePlayerSheetInput {
  gameId: ID!
  userId: ID!
  characterName: String
  pronouns: String
  bloodline: String
  origin: String
  post: String
  publicNotes: String
  privateNotes: String
  secretNotes: String
  fireflyNotes: String
}

input UpdatePlayerSheetInput {
  characterName: String
  pronouns: String
  bloodline: String
  origin: String
  post: String
  publicNotes: String
  privateNotes: String
  secretNotes: String
  fireflyNotes: String
}

input CreateShipSheetInput {
  gameId: ID!
  name: String!
  publicNotes: String
  gmNotes: String
  conditions: [String!]!
  stakesUsed: Int!
  stakesTotal: Int!
}

input UpdateShipSheetInput {
  name: String
  publicNotes: String
  gmNotes: String
  conditions: [String!]
  stakesUsed: Int
  stakesTotal: Int
}

input CreateClockInput {
  gameId: ID!
  name: String!
  lengths: [Int!]!
  visibility: ClockVisibility!
  gmNotes: String
}

input UpdateClockInput {
  name: String
  lengths: [Int!]
  visibility: ClockVisibility
  gmNotes: String
}

input RecordDiceRollInput {
  gameId: ID!
  playerCharacterName: String!
  numRolled: Int!
  numCut: Int!
}

type User {
  id: ID!
  name: String!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Game {
  id: ID!
  name: String!
  description: String
  publicNotes: String
  privateNotes: String
  fireflyUser: User!
  players: [ID!]!
  playerSheets: [PlayerSheet!]!
  shipSheet: ShipSheet
  clocks: [Clock!]!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type PlayerSheet {
  id: ID!
  game: Game!
  user: User!
  fireflyUserId: ID!
  characterName: String
  pronouns: String
  bloodline: String
  origin: String
  post: String
  publicNotes: String
  privateNotes: String
  secretNotes: String
  fireflyNotes: String
  milestones: [Milestone!]!
  drives: [String!]!
  mires: [Mire!]!
  edges: [Edge!]!
  skills: [Skill!]!
  languages: [Language!]!
  resources: [Resource!]!
  aspects: [Aspect!]!
  temporaryTracks: [TemporaryTrack!]!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Milestone {
  type: MilestoneType!
  description: String!
}

type Mire {
  description: String!
  notes: String
  level: Int!
}

type Edge {
  name: String!
  description: String!
}

type Skill {
  name: String!
  description: String!
  level: Int!
}

type Language {
  name: String!
  description: String!
  level: Int!
}

type Resource {
  type: ResourceType!
  description: String!
  tags: [String!]!
}

type Aspect {
  name: String!
  type: AspectType!
  track: Track!
  description: String!
}

type TemporaryTrack {
  name: String!
  type: TemporaryTrackType!
  track: Track!
  description: String!
}

type ShipSheet {
  id: ID!
  game: Game!
  name: String!
  publicNotes: String
  gmNotes: String
  conditions: [String!]!
  stakesUsed: Int!
  stakesTotal: Int!
  ratings: [Rating!]!
  design: Design!
  fittings: Fittings!
  undercrew: [Undercrew!]!
  reputation: [Reputation!]!
  cargo: [String!]!
  passengers: [String!]!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Rating {
  name: RatingName!
  track: Track!
}

type Design {
  size: String!
  frame: String!
  hull: String!
  bite: String!
  engine: String!
}

type Fittings {
  motifs: [String!]!
  additions: [String!]!
  rooms: [String!]!
  armaments: [String!]!
  outriders: [String!]!
}

type Undercrew {
  name: String!
  type: UndercrewType!
  track: Track!
  description: String!
}

type Reputation {
  name: String!
  track: Track!
}

type Track {
  length: Int!
  currentValue: Int!
}

type Clock {
  id: ID!
  game: Game!
  name: String!
  lengths: [Int!]!
  visibility: ClockVisibility!
  gmNotes: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type DiceRoll {
  id: ID!
  game: Game!
  playerCharacterName: String!
  numRolled: Int!
  numCut: Int!
  result: Int!
  twist: Boolean!
  rollValues: [Int!]!
  createdAt: AWSDateTime!
}

enum MilestoneType {
  MAJOR
  MINOR
}

enum ResourceType {
  SALVAGE
  SPECIMENS
  WHISPERS
  CHARTS
}

enum AspectType {
  TRAIT
  GEAR
  COMPANION
}

enum TemporaryTrackType {
  BENEFIT
  INJURY
  TRACK
}

enum RatingName {
  ARMOUR
  SEALS
  SPEED
  SAWS
  STEALTH
  TILT
}

enum UndercrewType {
  OFFICER
  GANG
  PACK
}

enum ClockVisibility {
  PUBLIC
  HIDDEN
}

type Query {
  getUser(id: ID!): User
  getGame(id: ID!): Game
  getPlayerSheet(id: ID!): PlayerSheet
  getShipSheet(id: ID!): ShipSheet
  getClock(id: ID!): Clock
  getDiceRoll(id: ID!): DiceRoll
  listFireflyGames(fireflyUserId: ID!): [Game!]!
  listGamePlayerSheets(gameId: ID!): [PlayerSheet!]!
  listGameClocks(gameId: ID!): [Clock!]!
  listGameDiceRolls(gameId: ID!): [DiceRoll!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  createGame(input: CreateGameInput!): Game!
  updateGame(id: ID!, input: UpdateGameInput!): Game!
  createPlayerSheet(input: CreatePlayerSheetInput!): PlayerSheet!
  updatePlayerSheet(id: ID!, input: UpdatePlayerSheetInput!): PlayerSheet!
  createShipSheet(input: CreateShipSheetInput!): ShipSheet!
  updateShipSheet(id: ID!, input: UpdateShipSheetInput!): ShipSheet!
  createClock(input: CreateClockInput!): Clock!
  updateClock(id: ID!, input: UpdateClockInput!): Clock!
  recordDiceRoll(input: RecordDiceRollInput!): DiceRoll!
}

type Subscription {
  onCreateUser: User
    @aws_subscribe(mutations: ["createUser"])
  onUpdateUser: User
    @aws_subscribe(mutations: ["updateUser"])
  onCreatePlayerSheet(gameId: ID!): PlayerSheet
    @aws_subscribe(mutations: ["createPlayerSheet"])
  onUpdatePlayerSheet(id: ID!): PlayerSheet
    @aws_subscribe(mutations: ["updatePlayerSheet"])
  onCreateShipSheet(gameId: ID!): ShipSheet
    @aws_subscribe(mutations: ["createShipSheet"])
  onUpdateShipSheet(id: ID!): ShipSheet
    @aws_subscribe(mutations: ["updateShipSheet"])
  onCreateClock(gameId: ID!): Clock
    @aws_subscribe(mutations: ["createClock"])
  onUpdateClock(id: ID!): Clock
    @aws_subscribe(mutations: ["updateClock"])
  onCreateDiceRoll(gameId: ID!): DiceRoll
    @aws_subscribe(mutations: ["recordDiceRoll"])
}
```

Please note that you'll need to ensure that the `players` list and `fireflyUserId` fields are correctly populated and maintained when creating or updating games and player sheets in your resolvers. Your resolvers can then leverage this information to perform efficient authorization checks using the Cognito User ID provided in the request context.
Human:

There are still issues handling private data fields in subscriptions (e.g.
fireflyNotes).
