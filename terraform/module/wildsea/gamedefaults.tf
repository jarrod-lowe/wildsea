# Game defaults for character names by language

locals {
  db_prefix_gamedefaults  = "GAMEDEFAULTS"
  db_prefix_gamepresets   = "GAMEPRESETS"
  db_prefix_language      = "LANGUAGE"
  fallback_language       = "en"
  initial_character_quota = "20"
  initial_section_quota   = "50"

  # Delta Green weapons presets - load from JSON file if it exists, otherwise empty
  weapons_file_path  = "${path.module}/../../../deltagreen-weapons.json"
  deltagreen_weapons = fileexists(local.weapons_file_path) ? jsondecode(file(local.weapons_file_path)) : {}
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
    remainingCharacters = {
      N = local.initial_character_quota
    }
    remainingSections = {
      N = local.initial_section_quota
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
    remainingCharacters = {
      N = local.initial_character_quota
    }
    remainingSections = {
      N = local.initial_section_quota
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
    remainingCharacters = {
      N = local.initial_character_quota
    }
    remainingSections = {
      N = local.initial_section_quota
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
    remainingCharacters = {
      N = local.initial_character_quota
    }
    remainingSections = {
      N = local.initial_section_quota
    }
    type = {
      S = local.db_prefix_gamedefaults
    }
  })
}

# Delta Green weapons presets - English
resource "aws_dynamodb_table_item" "deltagreen_weapons_en" {
  for_each = local.deltagreen_weapons

  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "${local.db_prefix_gamepresets}#deltagreen-weapons#${local.fallback_language}"
    }
    SK = {
      S = "${local.db_prefix_gamepresets}#${each.key}"
    }
    dataSetName = {
      S = "deltagreen-weapons"
    }
    language = {
      S = local.fallback_language
    }
    displayName = {
      S = each.value.display_name_en
    }
    data = {
      S = sensitive(jsonencode(merge(each.value.weapon_data, {
        description = each.value.description_en
        skillId     = each.value.skillId_en
      })))
    }
    type = {
      S = local.db_prefix_gamepresets
    }
  })
}

# Delta Green weapons presets - Klingon
resource "aws_dynamodb_table_item" "deltagreen_weapons_tlh" {
  for_each = local.deltagreen_weapons

  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "${local.db_prefix_gamepresets}#deltagreen-weapons#tlh"
    }
    SK = {
      S = "${local.db_prefix_gamepresets}#${each.key}"
    }
    dataSetName = {
      S = "deltagreen-weapons"
    }
    language = {
      S = "tlh"
    }
    displayName = {
      S = each.value.display_name_tlh
    }
    data = {
      S = sensitive(jsonencode(merge(each.value.weapon_data, {
        description = each.value.description_tlh
        skillId     = each.value.skillId_tlh
      })))
    }
    type = {
      S = local.db_prefix_gamepresets
    }
  })
}