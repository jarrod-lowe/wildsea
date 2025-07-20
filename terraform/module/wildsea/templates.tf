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
          sectionName = "Personal Data"
          sectionType = "KEYVALUE"
          content = jsonencode({
            items = [
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
              },
              {
                id          = "gender",
                name        = "Gender"
                description = ""
              },
              {
                id          = "age",
                name        = "Age and D.O.B."
                description = ""
              },
              {
                id          = "education",
                name        = "Education and Occupational History",
                description = ""
              },
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
                score                  = 10
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-con"
                name                   = "Constitution (CON)"
                description            = ""
                score                  = 10
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-dex"
                name                   = "Dexterity (DEX)"
                description            = ""
                score                  = 10
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-int"
                name                   = "Intelligence (INT)"
                description            = ""
                score                  = 10
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-pow"
                name                   = "Power (POW)"
                description            = ""
                score                  = 10
                distinguishingFeatures = ""
              },
              {
                id                     = "stat-cha"
                name                   = "Charisma (CHA)"
                description            = ""
                score                  = 10
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
              },
              {
                id            = "wp-item"
                name          = "Willpower Points (WP)"
                description   = ""
                attributeType = "WP"
                current       = 10
              },
              {
                id            = "san-item"
                name          = "Sanity Points (SAN)"
                description   = ""
                attributeType = "SAN"
                current       = 50
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
              },
              {
                id          = "skill-accounting"
                name        = "Accounting"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-anthropology"
                name        = "Anthropology"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-archeology"
                name        = "Archeology"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-art"
                name        = "Art: ARTFORM"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-artillery"
                name        = "Artillery"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-bureaucracy"
                name        = "Bureaucracy"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-computer-science"
                name        = "Computer Science"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-craft"
                name        = "Craft: CRAFT"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-criminology"
                name        = "Criminology"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-demolitions"
                name        = "Demolitions"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-disguise"
                name        = "Disguise"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-drive"
                name        = "Drive"
                description = ""
                roll        = 20
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-forensics"
                name        = "Forensics"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-heavy-machinery"
                name        = "Heavy Machinery"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-heavy-weapons"
                name        = "Heavy Weapons"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-history"
                name        = "History"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-humint"
                name        = "HUMINT"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-law"
                name        = "Law"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-medicine"
                name        = "Medicine"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-melee-weapons"
                name        = "Melee Weapons"
                description = ""
                roll        = 30
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-military-science"
                name        = "Military Science: SPECIALTY"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-navigate"
                name        = "Navigate"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-occult"
                name        = "Occult"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-pharmacy"
                name        = "Pharmacy"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-pilot"
                name        = "Pilot: AIRCRAFT"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-psychotherapy"
                name        = "Psychotherapy"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-ride"
                name        = "Ride"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-science"
                name        = "Science: FIELD"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-sigint"
                name        = "SIGINT"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-surgery"
                name        = "Surgery"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-survival"
                name        = "Survival"
                description = ""
                roll        = 10
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-swim"
                name        = "Swim"
                description = ""
                roll        = 20
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-unarmed-combat"
                name        = "Unarmed Combat"
                description = ""
                roll        = 40
                used        = false
                hasUsedFlag = true
              },
              {
                id          = "skill-unnatural"
                name        = "Unnatural"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = false
              },
              {
                id          = "skill-language"
                name        = "Language: LANGUAGE"
                description = ""
                roll        = 0
                used        = false
                hasUsedFlag = true
              }
            ]
          })
          position = 3
        },
        {
          sectionName = "Bonds"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "bonds"
                name        = "Bonds"
                description = ""
                markdown    = "Add your bonds here"
              }
            ]
            showEmpty = false
          })
          position = 4
        },
        {
          sectionName = "Motivations and Mental Disorders"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "motivations"
                name        = "Motivations and Mental Disorders"
                description = ""
                markdown    = "None"
              }
            ]
            showEmpty = false
          })
          position = 5
        },
        {
          sectionName = "Incidents of SAN loss without going insane"
          sectionType = "TRACKABLE"
          content = jsonencode({
            items = [
              {
                id          = "violence"
                name        = "Violence"
                description = ""
                length      = 3
                ticked      = 0
              },
              {
                id          = "helplessness"
                name        = "Helplessness"
                description = ""
                length      = 3
                ticked      = 0
              }
            ]
            showEmpty = true
          })
          position = 6
        },
        {
          sectionName = "Wounds and Ailments"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "wounds"
                name        = "Wounds and Ailments"
                description = ""
                markdown    = "None"
              }
            ]
            showEmpty = false
          })
          position = 7
        },
        {
          sectionName = "Armor and Gear"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "armor"
                name        = "Armor and Gear"
                description = ""
                markdown    = "None"
              }
            ]
            showEmpty = false
          })
          position = 8
        },
        {
          sectionName = "Weapons"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "weapons"
                name        = "Weapons"
                description = ""
                markdown    = "None"
              }
            ]
            showEmpty = false
          })
          position = 9
        },
        {
          sectionName = "Personal Details and Notes"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "personal"
                name        = "Personal Details and Notes"
                description = ""
                markdown    = "Describe your character here"
              }
            ]
            showEmpty = false
          })
          position = 10
        },
        {
          sectionName = "Developments which affect Home and Family"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "family"
                name        = "Developments which affect Home and Family"
                description = ""
                markdown    = "None"
              }
            ]
            showEmpty = false
          })
          position = 11
        },
        {
          sectionName = "Special Training"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "training"
                name        = "Special Training"
                description = ""
                markdown    = "None"
              }
            ]
            showEmpty = false
          })
          position = 12
        }
      ])
    }
  })
}