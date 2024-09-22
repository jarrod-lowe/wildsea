// Code generated by make-schema. DO NOT EDIT
    
      export const getGameQuery = `
        query getGame($id: ID!) {
          getGame(id: $id) {
            gameId gameName gameDescription playerSheets { userId gameId characterName sections { userId gameId sectionId type sectionName sectionType content createdAt updatedAt } type createdAt updatedAt } joinToken createdAt updatedAt type
          }
        }
      `;
    
      export const getGamesQuery = `
        query getGames {
          getGames {
            gameId gameName gameDescription characterName type createdAt updatedAt
          }
        }
      `;
    

    
      export const createGameMutation = `
        mutation createGame($input: CreateGameInput!) {
          createGame(input: $input) {
            gameId gameName gameDescription playerSheets { userId gameId characterName sections { userId gameId sectionId type sectionName sectionType content createdAt updatedAt } type createdAt updatedAt } joinToken createdAt updatedAt type
          }
        }
      `;
    
      export const joinGameMutation = `
        mutation joinGame($input: JoinGameInput!) {
          joinGame(input: $input) {
            gameId gameName gameDescription playerSheets { userId gameId characterName sections { userId gameId sectionId type sectionName sectionType content createdAt updatedAt } type createdAt updatedAt } joinToken createdAt updatedAt type
          }
        }
      `;
    
      export const createSectionMutation = `
        mutation createSection($input: CreateSectionInput!) {
          createSection(input: $input) {
            userId gameId sectionId type sectionName sectionType content createdAt updatedAt
          }
        }
      `;
    
      export const updateSectionMutation = `
        mutation updateSection($input: UpdateSectionInput!) {
          updateSection(input: $input) {
            userId gameId sectionId type sectionName sectionType content createdAt updatedAt
          }
        }
      `;
    
      export const updatePlayerSheetMutation = `
        mutation updatePlayerSheet($input: UpdatePlayerSheetInput!) {
          updatePlayerSheet(input: $input) {
            gameId gameName gameDescription characterName type createdAt updatedAt
          }
        }
      `;
    
  