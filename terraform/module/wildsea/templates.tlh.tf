# Character templates for auto-populate feature - Klingon (tlh)
resource "aws_dynamodb_table_item" "template_wildsea_basic_tlh" {
  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "TEMPLATE#wildsea#tlh"
    }
    SK = {
      S = "TEMPLATE#motlhbe' jup"
    }
    templateName = {
      S = "motlhbe' jup"
    }
    displayName = {
      S = "motlhbe' jup"
    }
    gameType = {
      S = "wildsea"
    }
    language = {
      S = "tlh"
    }
    type = {
      S = "TEMPLATE"
    }
    sections = {
      S = jsonencode([
        {
          sectionName = "jup nav"
          sectionType = "KEYVALUE"
          content = jsonencode({
            items = [
              {
                id          = "name"
                name        = "pagh"
                description = ""
              },
              {
                id          = "origin"
                name        = "mI'"
                description = ""
              },
              {
                id          = "post"
                name        = "Daq"
                description = ""
              },
              {
                id          = "call"
                name        = "DIch"
                description = ""
              }
            ]
            showEmpty = true
          })
          position = 0
        },
        {
          sectionName = "jup"
          sectionType = "TRACKABLE"
          content = jsonencode({
            items = [
              {
                id          = "iron"
                name        = "baS"
                description = ""
                length      = 5
                ticked      = 2
              },
              {
                id          = "teeth"
                name        = "DIrgh"
                description = ""
                length      = 5
                ticked      = 2
              },
              {
                id          = "veils"
                name        = "Sor"
                description = ""
                length      = 5
                ticked      = 2
              }
            ]
            showEmpty = true
          })
          position = 1
        },
        {
          sectionName = "nugh"
          sectionType = "TRACKABLE"
          content = jsonencode({
            items = [
              {
                id          = "break"
                name        = "DIch"
                description = ""
                length      = 3
                ticked      = 0
              },
              {
                id          = "delve"
                name        = "nej"
                description = ""
                length      = 3
                ticked      = 0
              },
              {
                id          = "hunt"
                name        = "DIch"
                description = ""
                length      = 3
                ticked      = 0
              },
              {
                id          = "outwit"
                name        = "val"
                description = ""
                length      = 3
                ticked      = 0
              },
              {
                id          = "study"
                name        = "ghoj"
                description = ""
                length      = 3
                ticked      = 0
              },
              {
                id          = "sway"
                name        = "DIch"
                description = ""
                length      = 3
                ticked      = 0
              }
            ]
            showEmpty = true
          })
          position = 2
        },
        {
          sectionName = "nugh"
          sectionType = "BURNABLE"
          content = jsonencode({
            items = [
              {
                id          = "salvage"
                name        = "choq"
                description = ""
                length      = 3
                states      = ["unticked", "unticked", "unticked"]
              },
              {
                id          = "specimens"
                name        = "naDev"
                description = ""
                length      = 3
                states      = ["unticked", "unticked", "unticked"]
              },
              {
                id          = "whispers"
                name        = "jach"
                description = ""
                length      = 3
                states      = ["unticked", "unticked", "unticked"]
              },
              {
                id          = "charts"
                name        = "pu'jIn"
                description = ""
                length      = 3
                states      = ["unticked", "unticked", "unticked"]
              }
            ]
            showEmpty = true
          })
          position = 3
        }
      ])
    }
  })
}

# Delta Green Basic Character Template - Klingon (tlh)
resource "aws_dynamodb_table_item" "template_deltagreen_basic_tlh" {
  table_name = aws_dynamodb_table.table.name
  hash_key   = aws_dynamodb_table.table.hash_key
  range_key  = aws_dynamodb_table.table.range_key

  item = jsonencode({
    PK = {
      S = "TEMPLATE#deltaGreen#tlh"
    }
    SK = {
      S = "TEMPLATE#motlhbe' jup"
    }
    templateName = {
      S = "motlhbe' jup"
    }
    displayName = {
      S = "motlhbe' jup"
    }
    gameType = {
      S = "deltaGreen"
    }
    language = {
      S = "tlh"
    }
    type = {
      S = "TEMPLATE"
    }
    sections = {
      S = jsonencode([
        {
          sectionName = "nugh naDev"
          sectionType = "KEYVALUE"
          content = jsonencode({
            items = [
              {
                id          = "profession"
                name        = "DIlo'"
                description = ""
              },
              {
                id          = "employer"
                name        = "DIch"
                description = ""
              },
              {
                id          = "nationality"
                name        = "Hol"
                description = ""
              },
              {
                id          = "gender",
                name        = "DIch"
                description = ""
              },
              {
                id          = "age",
                name        = "DIch 'ej jup"
                description = ""
              },
              {
                id          = "education",
                name        = "ghojmeH mI' 'ej DIlo' mI'",
                description = ""
              },
            ]
            showEmpty = true
          })
          position = 0
        },
        {
          sectionName = "naDev"
          sectionType = "DELTAGREENSTATS"
          content = jsonencode({
            showEmpty = false
            items = [
              for stat in local.delta_green_stats_tlh : {
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
          sectionName = "chenmoH naDev"
          sectionType = "DELTAGREENDERED"
          content = jsonencode({
            showEmpty = false
            items = [
              for derived in local.delta_green_derived_tlh : {
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
          sectionName = "nugh"
          sectionType = "DELTAGREENSKILLS"
          content = jsonencode({
            showEmpty = false
            items = [
              for skill in local.delta_green_skills_tlh : {
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
          sectionName = "jup"
          sectionType = "DELTAGREENBONDS"
          content = jsonencode({
            items     = []
            showEmpty = false
          })
          position = 4
        },
        {
          sectionName = "nugh 'ej valwI' DIch"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "motivations"
                name        = "nugh 'ej valwI' DIch"
                description = ""
                markdown    = "pagh"
              }
            ]
            showEmpty = false
          })
          position = 5
        },
        {
          sectionName = "SAN Huj 'e' DIch"
          sectionType = "TRACKABLE"
          content = jsonencode({
            items = [
              {
                id          = "violence"
                name        = "HIv"
                description = ""
                length      = 3
                ticked      = 0
              },
              {
                id          = "helplessness"
                name        = "jagh"
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
          sectionName = "DIch 'ej naDev"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "wounds"
                name        = "DIch 'ej naDev"
                description = ""
                markdown    = "pagh"
              }
            ]
            showEmpty = false
          })
          position = 7
        },
        {
          sectionName = "So' 'ej nugh"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "armor"
                name        = "So' 'ej nugh"
                description = ""
                markdown    = "pagh"
              }
            ]
            showEmpty = false
          })
          position = 8
        },
        {
          sectionName = "nuH"
          sectionType = "DELTAGREENWEAPONS"
          content = jsonencode({
            items = [
              {
                id          = "weapons"
                name        = "nuH"
                description = ""
                markdown    = "pagh"
              }
            ]
            showEmpty = false
          })
          position = 9
        },
        {
          sectionName = "nugh naDev 'ej chup"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "personal"
                name        = "nugh naDev 'ej chup"
                description = ""
                markdown    = "jup DIch"
              }
            ]
            showEmpty = false
          })
          position = 10
        },
        {
          sectionName = "juH 'ej DIch DIch"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "family"
                name        = "juH 'ej DIch DIch"
                description = ""
                markdown    = "pagh"
              }
            ]
            showEmpty = false
          })
          position = 11
        },
        {
          sectionName = "nugh DIch"
          sectionType = "RICHTEXT"
          content = jsonencode({
            items = [
              {
                id          = "training"
                name        = "nugh DIch"
                description = ""
                markdown    = "pagh"
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
  delta_green_skills_tlh  = jsondecode(file("${path.module}/../../../ui/src/seed/deltaGreenSkills.tlh.json"))
  delta_green_stats_tlh   = jsondecode(file("${path.module}/../../../ui/src/seed/deltaGreenStats.tlh.json"))
  delta_green_derived_tlh = jsondecode(file("${path.module}/../../../ui/src/seed/deltaGreenDerived.tlh.json"))
}