# Character templates for auto-populate feature
resource "aws_dynamodb_table_item" "template_wildsea_basic" {
  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "TEMPLATE#wildsea#en"
    }
    SK = {
      S = "TEMPLATE#Basic Character"
    }
    templateName = {
      S = "Basic Character"
    }
    displayName = {
      S = "Basic Character"
    }
    gameType = {
      S = "wildsea"
    }
    language = {
      S = "en"
    }
    type = {
      S = "TEMPLATE"
    }
    sections = {
      S = jsonencode([
        {
          sectionName = "Character Details"
          sectionType = "KEYVALUE"
          content = jsonencode({
            items = [
              {
                id          = "name"
                name        = "Name"
                description = ""
              },
              {
                id          = "origin"
                name        = "Origin"
                description = ""
              },
              {
                id          = "post"
                name        = "Post"
                description = ""
              },
              {
                id          = "call"
                name        = "Call"
                description = ""
              }
            ]
            showEmpty = true
          })
          position = 0
        },
        {
          sectionName = "Edges"
          sectionType = "TRACKABLE"
          content = jsonencode({
            items = [
              {
                id          = "iron"
                name        = "Iron"
                description = ""
                current     = 2
                maximum     = 5
              },
              {
                id          = "teeth"
                name        = "Teeth"
                description = ""
                current     = 2
                maximum     = 5
              },
              {
                id          = "veils"
                name        = "Veils"
                description = ""
                current     = 2
                maximum     = 5
              }
            ]
            showEmpty = false
          })
          position = 1
        },
        {
          sectionName = "Skills"
          sectionType = "TRACKABLE"
          content = jsonencode({
            items = [
              {
                id          = "break"
                name        = "Break"
                description = ""
                current     = 0
                maximum     = 3
              },
              {
                id          = "delve"
                name        = "Delve"
                description = ""
                current     = 0
                maximum     = 3
              },
              {
                id          = "hunt"
                name        = "Hunt"
                description = ""
                current     = 0
                maximum     = 3
              },
              {
                id          = "outwit"
                name        = "Outwit"
                description = ""
                current     = 0
                maximum     = 3
              },
              {
                id          = "study"
                name        = "Study"
                description = ""
                current     = 0
                maximum     = 3
              },
              {
                id          = "sway"
                name        = "Sway"
                description = ""
                current     = 0
                maximum     = 3
              }
            ]
            showEmpty = false
          })
          position = 2
        },
        {
          sectionName = "Resources"
          sectionType = "BURNABLE"
          content = jsonencode({
            items = [
              {
                id          = "salvage"
                name        = "Salvage"
                description = ""
                length      = 3
                states      = ["unticked", "unticked", "unticked"]
              },
              {
                id          = "specimens"
                name        = "Specimens"
                description = ""
                length      = 3
                states      = ["unticked", "unticked", "unticked"]
              },
              {
                id          = "whispers"
                name        = "Whispers"
                description = ""
                length      = 3
                states      = ["unticked", "unticked", "unticked"]
              },
              {
                id          = "charts"
                name        = "Charts"
                description = ""
                length      = 3
                states      = ["unticked", "unticked", "unticked"]
              }
            ]
            showEmpty = false
          })
          position = 3
        }
      ])
    }
  })
}

# Delta Green Basic Character Template
resource "aws_dynamodb_table_item" "template_deltagreen_basic" {
  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "TEMPLATE#deltaGreen#en"
    }
    SK = {
      S = "TEMPLATE#Basic Agent"
    }
    templateName = {
      S = "Basic Agent"
    }
    displayName = {
      S = "Basic Agent"
    }
    gameType = {
      S = "deltaGreen"
    }
    language = {
      S = "en"
    }
    type = {
      S = "TEMPLATE"
    }
    sections = {
      S = jsonencode([
        {
          sectionName = "Agent Details"
          sectionType = "KEYVALUE"
          content = jsonencode({
            items = [
              {
                id          = "name"
                name        = "Name"
                description = ""
              },
              {
                id          = "profession"
                name        = "Profession"
                description = ""
              },
              {
                id          = "employer"
                name        = "Employer"
                description = ""
              },
              {
                id          = "nationality"
                name        = "Nationality"
                description = ""
              }
            ]
            showEmpty = true
          })
          position = 0
        },
        {
          sectionName = "Statistics"
          sectionType = "DELTAGREENSTATS"
          content = jsonencode({
            showEmpty = false
            items = [
              {
                id                     = "stat-str"
                name                   = "Strength (STR)"
                description            = ""
                score                  = 50
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-con"
                name                   = "Constitution (CON)"
                description            = ""
                score                  = 50
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-dex"
                name                   = "Dexterity (DEX)"
                description            = ""
                score                  = 50
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-int"
                name                   = "Intelligence (INT)"
                description            = ""
                score                  = 50
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-pow"
                name                   = "Power (POW)"
                description            = ""
                score                  = 50
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-cha"
                name                   = "Charisma (CHA)"
                description            = ""
                score                  = 50
                distinguishingFeatures = ""
              }
            ]
          })
          position = 1
        },
        {
          sectionName = "Derived Attributes"
          sectionType = "DELTAGREENDERED"
          content = jsonencode({
            showEmpty = false
            items = [
              {
                id            = "hp-item"
                name          = "Hit Points (HP)"
                description   = ""
                attributeType = "HP"
                current       = 10
                maximum       = 10
              },
              {
                id            = "wp-item"
                name          = "Willpower Points (WP)"
                description   = ""
                attributeType = "WP"
                current       = 10
                maximum       = 10
              },
              {
                id            = "san-item"
                name          = "Sanity Points (SAN)"
                description   = ""
                attributeType = "SAN"
                current       = 50
                maximum       = 50
              },
              {
                id            = "bp-item"
                name          = "Breaking Point (BP)"
                description   = ""
                attributeType = "BP"
                current       = 40
              }
            ]
          })
          position = 2
        },
        {
          sectionName = "Skills"
          sectionType = "DELTAGREENSKILLS"
          content = jsonencode({
            showEmpty = false
            items = [
              {
                id          = "skill-alertness"
                name        = "Alertness"
                description = ""
                roll        = 20
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-athletics"
                name        = "Athletics"
                description = ""
                roll        = 30
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-dodge"
                name        = "Dodge"
                description = ""
                roll        = 30
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-firearms"
                name        = "Firearms"
                description = ""
                roll        = 20
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-first-aid"
                name        = "First Aid"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-persuade"
                name        = "Persuade"
                description = ""
                roll        = 20
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-search"
                name        = "Search"
                description = ""
                roll        = 20
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-stealth"
                name        = "Stealth"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              }
            ]
          })
          position = 3
        }
      ])
    }
  })
}