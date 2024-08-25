UI_JQ_FILTER := { \
	identity_pool: .cognito_identity_pool_id.value, \
	user_pool: .cognito_user_pool_id.value, \
	web_client: .cognito_web_client_id.value, \
	graphql: .graphql_uri.value, \
	region: .region.value, \
	loginDomain: .cognito_login_domain.value \
}

ui/config/output-%.json: terraform/environment/wildsea-%/.apply
	cd $(dir $^) ; terraform output -json | tee ../../../$@

ui/config/config-%.json: ui/config/output-%.json
	jq "$(UI_JQ_FILTER)" $< >$@

.PHONY: ui-local
ui-local: ui/config/config-dev.json appsync/schema.ts appsync/graphql.ts terraform/environment/wildsea-dev/.apply
	cp $< ui/public/config.json
	docker run --rm -it --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/ui --network host node:20 npm run dev
