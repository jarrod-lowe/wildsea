# Game defaults for character names by language

locals {
  db_prefix_gamedefaults = "GAMEDEFAULTS"
  db_prefix_language     = "LANGUAGE"
  fallback_language      = "en"
}

# English defaults
resource "aws_dynamodb_table_item" "gamedefaults_wildsea_en" {
  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "${local.db_prefix_gamedefaults}#${local.fallback_language}"
    }
    SK = {
      S = "${local.db_prefix_gamedefaults}#wildsea"
    }
    gameType = {
      S = "wildsea"
    }
    displayName = {
      S = "Wildsea"
    }
    defaultCharacterName = {
      S = "Unnamed Character"
    }
    defaultGMName = {
      S = "Firefly"
    }
    defaultNPCs = {
      L = [
        {
          M = {
            type = {
              S = "NPC"
            }
            characterName = {
              S = "Unnamed Ship"
            }
          }
        }
      ]
    }
    theme = {
      S = "wildsea"
    }
    type = {
      S = local.db_prefix_gamedefaults
    }
  })
}

resource "aws_dynamodb_table_item" "gamedefaults_deltagreen_en" {
  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "${local.db_prefix_gamedefaults}#${local.fallback_language}"
    }
    SK = {
      S = "${local.db_prefix_gamedefaults}#deltaGreen"
    }
    gameType = {
      S = "deltaGreen"
    }
    displayName = {
      S = "Delta Green"
    }
    defaultCharacterName = {
      S = "Unidentified Agent"
    }
    defaultGMName = {
      S = "Handler"
    }
    defaultNPCs = {
      L = []
    }
    theme = {
      S = "deltaGreen"
    }
    type = {
      S = local.db_prefix_gamedefaults
    }
  })
}

# Klingon (tlh) defaults
resource "aws_dynamodb_table_item" "gamedefaults_wildsea_tlh" {
  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "${local.db_prefix_gamedefaults}#tlh"
    }
    SK = {
      S = "${local.db_prefix_gamedefaults}#wildsea"
    }
    gameType = {
      S = "wildsea"
    }
    displayName = {
      S = "mI'lugh bIQ"
    }
    defaultCharacterName = {
      S = "motlhbe' jup"
    }
    defaultGMName = {
      S = "yoDwI'"
    }
    defaultNPCs = {
      L = [
        {
          M = {
            type = {
              S = "NPC"
            }
            characterName = {
              S = "motlhbe' DIch"
            }
          }
        }
      ]
    }
    theme = {
      S = "wildsea"
    }
    type = {
      S = local.db_prefix_gamedefaults
    }
  })
}

resource "aws_dynamodb_table_item" "gamedefaults_deltagreen_tlh" {
  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "${local.db_prefix_gamedefaults}#tlh"
    }
    SK = {
      S = "${local.db_prefix_gamedefaults}#deltaGreen"
    }
    gameType = {
      S = "deltaGreen"
    }
    displayName = {
      S = "mI'lugh SuD"
    }
    defaultCharacterName = {
      S = "Sovbe'ghach DIch"
    }
    defaultGMName = {
      S = "DIch SeHwI'"
    }
    defaultNPCs = {
      L = []
    }
    theme = {
      S = "deltaGreen"
    }
    type = {
      S = local.db_prefix_gamedefaults
    }
  })
}