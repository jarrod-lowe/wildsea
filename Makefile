default: all

ENVIRONMENT ?= dev
TERRAFORM_ENVIRONMENTS := aws github wildsea aws-dev wildsea-dev
TERRAFOM_VALIDATE := $(addsuffix /.validate,$(addprefix terraform/environment/, $(TERRAFORM_ENVIRONMENTS)))
TERRAFORM_MODULES := iac-roles oidc state-bucket wildsea
ACCOUNT_ID := $(shell aws sts get-caller-identity --query 'Account' --output text)
AWS_REGION ?= "ap-southeast-2"
RO_ROLE = arn:aws:iam::$(ACCOUNT_ID):role/GitHubAction-Wildsea-ro-dev
RW_ROLE = arn:aws:iam::$(ACCOUNT_ID):role/GitHubAction-Wildsea-rw-dev

all: $(TERRAFOM_VALIDATE)

include graphql/graphql.mk
include appsync/appsync.mk
include ui/ui.mk
include design/for-claude.mk

.PHONY: terraform-format
terraform-format: $(addprefix terraform-format-environment-,$(TERRAFORM_ENVIRONMENTS)) $(addprefix terraform-format-module-,$(TERRAFORM_MODULES))
	@true

.PHONY: terraform-format-environment-%
terraform-format-environment-%:
	cd terraform/environment/$*; terraform fmt

.PHONY: terraform-format-module-%
terraform-format-module-%:
	cd terraform/module/$*; terraform fmt

terraform/environment/%/.validate: terraform/environment/%/*.tf terraform-format
	cd terraform/environment/$* ; terraform fmt
	cd terraform/environment/$* ; terraform validate
	touch $@

.PHONY: dev
dev: ui/config/output-dev.json $(GRAPHQL_DEV) terraform-format terraform/environment/aws-dev/.apply terraform/environment/wildsea-dev/.apply ui/.push 
	@echo URL is "https://$$(jq -r .cdn_domain_name.value $<)/"

terraform/environment/aws-dev/.apply: terraform/environment/aws-dev/*.tf terraform/module/iac-roles/*.tf
	AUTO_APPROVE=yes ./terraform/environment/aws-dev/deploy.sh $(ACCOUNT_ID) dev
	touch $@

terraform/environment/wildsea-dev/plan.tfplan: terraform/environment/wildsea-dev/*.tf terraform/module/wildsea/*.tf terraform/environment/wildsea-dev/.terraform $(GRAPHQL_JS)
	cd terraform/environment/wildsea-dev ; ../../../scripts/run-as.sh $(RO_ROLE) \
		terraform plan -out=./plan.tfplan

terraform/environment/wildsea-dev/.apply: terraform/environment/wildsea-dev/plan.tfplan $(GRAPHQL_JS)
	cd terraform/environment/wildsea-dev ; \
	../../../scripts/run-as.sh $(RW_ROLE) \
		terraform apply ./plan.tfplan || status=$$? ; \
		rm -v ./plan.tfplan ; \
		[ -z "$$status" ] || exit $$status
	touch $@

terraform/environment/wildsea-dev/.terraform: terraform/environment/wildsea-dev/*.tf terraform/module/wildsea/*.tf 
	cd terraform/environment/wildsea-dev ; terraform init \
		-backend-config=bucket=terraform-state-$(ACCOUNT_ID) \
        -backend-config=key=dev/terraform.tfstate \
        -backend-config=region=$(AWS_REGION)

.PHONY: clean
clean:
	rm -f terraform/environment/*/.validate
	rm -f terraform/environment/*/plan.tfplan
	rm -f graphql/mutation/*/appsync.js
	rm -f graphql/query/*/appsync.js
	rm -f graphql/subscription/*/appsync.js
	rm -f graphql/functions/*/appsync.js
	rm -rf graphql/node_modules
	rm -rf graphql/coverage
	rm -rf appsync/node_modules
	rm -rf ui/node_modules
	rm -f ui/config/*
	rm -f ui/public/config.json
	rm -rf ui/dist/*
	rm -rf ui/coverage
