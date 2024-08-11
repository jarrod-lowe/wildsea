default: all

TERRAFORM_ENVIRONMENTS := aws github wildsea aws-dev wildsea-dev
TERRAFOM_VALIDATE := $(addsuffix /.validate,$(addprefix terraform/environment/, $(TERRAFORM_ENVIRONMENTS)))
ACCOUNT_ID := $(shell aws sts get-caller-identity --query 'Account' --output text)
AWS_REGION ?= "ap-southeast-2"
RO_ROLE = arn:aws:iam::$(ACCOUNT_ID):role/GitHubAction-Wildsea-ro-dev
RW_ROLE = arn:aws:iam::$(ACCOUNT_ID):role/GitHubAction-Wildsea-rw-dev

all: $(TERRAFOM_VALIDATE)

terraform/environment/%/.validate: terraform/environment/%/*.tf
	cd terraform/environment/$* ; terraform fmt
	cd terraform/environment/$* ; terraform validate
	touch $@

.PHONY: dev
dev: terraform/environment/aws-dev/.apply terraform/environment/wildsea-dev/.apply
	@true

terraform/environment/aws-dev/.apply: terraform/environment/aws-dev/*.tf terraform/module/iac-roles/*.tf
	./terraform/environment/aws-dev/deploy.sh $(ACCOUNT_ID) dev
	touch $@

terraform/environment/wildsea-dev/.plan: terraform/environment/wildsea-dev/*.tf terraform/module/wildsea/*.tf terraform/environment/wildsea-dev/.terraform
	cd terraform/environment/wildsea-dev ; ../../../scripts/run-as.sh $(RO_ROLE) \
		terraform plan -out=./plan

terraform/environment/wildsea-dev/.apply: terraform/environment/wildsea-dev/.plan
	cd terraform/environment/wildsea-dev ; ../../../scripts/run-as.sh $(RW_ROLE) \
		terraform apply ./plan
	touch $@

terraform/environment/wildsea-dev/.terraform: terraform/environment/wildsea-dev/*.tf terraform/module/wildsea/*.tf 
	cd terraform/environment/wildsea-dev ; terraform init \
		-backend-config=bucket=terraform-state-$(ACCOUNT_ID) \
        -backend-config=key=dev/terraform.tfstate \
        -backend-config=region=$(AWS_REGION)
