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
      S = "${local.db_prefix_gamedefaults}#wildsea"
    }
    SK = {
      S = "${local.db_prefix_language}#${local.fallback_language}"
    }
    defaultCharacterName = {
      S = "Unnamed Character"
    }
    defaultGMName = {
      S = "Firefly"
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
      S = "${local.db_prefix_gamedefaults}#deltaGreen"
    }
    SK = {
      S = "${local.db_prefix_language}#${local.fallback_language}"
    }
    defaultCharacterName = {
      S = "Unidentified Agent"
    }
    defaultGMName = {
      S = "Handler"
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
      S = "${local.db_prefix_gamedefaults}#wildsea"
    }
    SK = {
      S = "${local.db_prefix_language}#tlh"
    }
    defaultCharacterName = {
      S = "motlhbe' jup"
    }
    defaultGMName = {
      S = "yoDwI'"
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
      S = "${local.db_prefix_gamedefaults}#deltaGreen"
    }
    SK = {
      S = "${local.db_prefix_language}#tlh"
    }
    defaultCharacterName = {
      S = "Sovbe'ghach DIch"
    }
    defaultGMName = {
      S = "DIch SeHwI'"
    }
    type = {
      S = local.db_prefix_gamedefaults
    }
  })
}