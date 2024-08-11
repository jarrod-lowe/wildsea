default: all

TERRAFORM_ENVIRONMENTS := aws github wildsea
TERRAFOM_VALIDATE := $(addsuffix /.validate,$(addprefix terraform/environment/, $(TERRAFORM_ENVIRONMENTS)))

all: $(TERRAFOM_VALIDATE)

terraform/environment/%/.validate: terraform/environment/%/*.tf
	cd terraform/environment/$* ; terraform fmt
	cd terraform/environment/$* ; terraform validate
	touch $@
