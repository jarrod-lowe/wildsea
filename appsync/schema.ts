// Code generated by make-schema. DO NOT EDIT
    
      export const getGameQuery = `
        query getGame($input: GetGameInput) {
          getGame(input: $input) {
            gameId gameName gameDescription playerSheets { userId gameId characterName sections { userId gameId sectionId type sectionName sectionType content position createdAt updatedAt deleted } type createdAt updatedAt fireflyUserId } joinToken fireflyUserId createdAt updatedAt type deleted
          }
        }
      `;
    
      export const getGamesQuery = `
        query getGames {
          getGames {
            userId gameId gameName gameDescription characterName type createdAt updatedAt deleted
          }
        }
      `;
    

    
      export const createGameMutation = `
        mutation createGame($input: CreateGameInput!) {
          createGame(input: $input) {
            gameId gameName gameDescription fireflyUserId createdAt updatedAt type deleted
          }
        }
      `;
    
      export const joinGameMutation = `
        mutation joinGame($input: JoinGameInput!) {
          joinGame(input: $input) {
            gameId gameName gameDescription fireflyUserId createdAt updatedAt type deleted
          }
        }
      `;
    
      export const updateGameMutation = `
        mutation updateGame($input: UpdateGameInput!) {
          updateGame(input: $input) {
            gameId gameName gameDescription fireflyUserId createdAt updatedAt type deleted
          }
        }
      `;
    
      export const deleteGameMutation = `
        mutation deleteGame($input: DeleteGameInput!) {
          deleteGame(input: $input) {
            gameId gameName gameDescription fireflyUserId createdAt updatedAt type deleted
          }
        }
      `;
    
      export const createSectionMutation = `
        mutation createSection($input: CreateSectionInput!) {
          createSection(input: $input) {
            userId gameId sectionId type sectionName sectionType content position createdAt updatedAt deleted
          }
        }
      `;
    
      export const updateSectionMutation = `
        mutation updateSection($input: UpdateSectionInput!) {
          updateSection(input: $input) {
            userId gameId sectionId type sectionName sectionType content position createdAt updatedAt deleted
          }
        }
      `;
    
      export const deleteSectionMutation = `
        mutation deleteSection($input: DeleteSectionInput!) {
          deleteSection(input: $input) {
            userId gameId sectionId type sectionName sectionType content position createdAt updatedAt deleted
          }
        }
      `;
    
      export const updatePlayerSheetMutation = `
        mutation updatePlayerSheet($input: UpdatePlayerSheetInput!) {
          updatePlayerSheet(input: $input) {
            userId gameId gameName gameDescription characterName type createdAt updatedAt deleted
          }
        }
      `;
    
      export const deletePlayerMutation = `
        mutation deletePlayer($input: DeletePlayerInput!) {
          deletePlayer(input: $input) {
            userId gameId gameName gameDescription characterName type createdAt updatedAt deleted
          }
        }
      `;
    

    
      export const updatedPlayerSheetSubscription = `
        subscription updatedPlayerSheet($gameId: ID!) {
          updatedPlayerSheet(gameId: $gameId) {
            userId gameId gameName gameDescription characterName type createdAt updatedAt deleted
          }
        }
      `;
    
      export const updatedSectionSubscription = `
        subscription updatedSection($gameId: ID!) {
          updatedSection(gameId: $gameId) {
            userId gameId sectionId type sectionName sectionType content position createdAt updatedAt deleted
          }
        }
      `;
    
      export const updatedGameSubscription = `
        subscription updatedGame($gameId: ID!) {
          updatedGame(gameId: $gameId) {
            gameId gameName gameDescription fireflyUserId createdAt updatedAt type deleted
          }
        }
      `;
    
  