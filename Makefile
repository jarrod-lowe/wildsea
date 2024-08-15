default: all

TERRAFORM_ENVIRONMENTS := aws github wildsea aws-dev wildsea-dev
TERRAFOM_VALIDATE := $(addsuffix /.validate,$(addprefix terraform/environment/, $(TERRAFORM_ENVIRONMENTS)))
TERRAFORM_MODULES := iac-roles oidc state-bucket wildsea
ACCOUNT_ID := $(shell aws sts get-caller-identity --query 'Account' --output text)
AWS_REGION ?= "ap-southeast-2"
RO_ROLE = arn:aws:iam::$(ACCOUNT_ID):role/GitHubAction-Wildsea-ro-dev
RW_ROLE = arn:aws:iam::$(ACCOUNT_ID):role/GitHubAction-Wildsea-rw-dev

all: $(TERRAFOM_VALIDATE)

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
dev: terraform-format terraform/environment/aws-dev/.apply terraform/environment/wildsea-dev/.apply
	@true

terraform/environment/aws-dev/.apply: terraform/environment/aws-dev/*.tf terraform/module/iac-roles/*.tf
	./terraform/environment/aws-dev/deploy.sh $(ACCOUNT_ID) dev
	touch $@

terraform/environment/wildsea-dev/plan.tfplan: terraform/environment/wildsea-dev/*.tf terraform/module/wildsea/*.tf terraform/environment/wildsea-dev/.terraform
	cd terraform/environment/wildsea-dev ; ../../../scripts/run-as.sh $(RO_ROLE) \
		terraform plan -out=./plan.tfplan

terraform/environment/wildsea-dev/.apply: terraform/environment/wildsea-dev/plan.tfplan
	cd terraform/environment/wildsea-dev ; ../../../scripts/run-as.sh $(RW_ROLE) \
		terraform apply ./plan.tfplan
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
