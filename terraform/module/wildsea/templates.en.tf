# Character templates for auto-populate feature
resource "aws_dynamodb_table_item" "template_wildsea_basic_en" {
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
resource "aws_dynamodb_table_item" "template_deltagreen_basic_en" {
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
              for stat in local.delta_green_stats : {
                id                     = "stat-${lower(stat.abbreviation)}"
                name                   = stat.name
                description            = ""
                score                  = 10
                distinguishingFeatures = ""
                abbreviation           = stat.abbreviation
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
              for derived in local.delta_green_derived : {
                id            = "${lower(derived.attributeType)}-item"
                name          = derived.name
                description   = ""
                attributeType = derived.attributeType
                current       = derived.defaultCurrent
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
              for skill in local.delta_green_skills : {
                id          = "skill-${replace(lower(skill.name), " ", "-")}"
                name        = skill.name
                description = lookup(skill, "description", "")
                roll        = skill.roll
                used        = false
                hasUsedFlag = lookup(skill, "hasUsedFlag", true)
              }
            ]
          })
          position = 3
        },
        {
          sectionName = "Bonds"
          sectionType = "DELTAGREENBONDS"
          content = jsonencode({
            items     = []
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
          sectionType = "DELTAGREENWEAPONS"
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

locals {
  delta_green_skills  = jsondecode(file("${path.module}/../../../ui/src/seed/deltaGreenSkills.en.json"))
  delta_green_stats   = jsondecode(file("${path.module}/../../../ui/src/seed/deltaGreenStats.en.json"))
  delta_green_derived = jsondecode(file("${path.module}/../../../ui/src/seed/deltaGreenDerived.en.json"))
}