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

ui/node_modules: ui/package.json
	cd ui ; npm install

ui/dist/index.html: ui/config/config-dev.json appsync/schema.ts appsync/graphql.ts terraform/environment/wildsea-dev/.apply ui/src/*.ts ui/src/amplifyconfiguration.json ui/index.html ui/node_modules
	cp $< ui/public/config.json
	docker run --rm -it --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/ui --network host node:20 npm run build

ui/.push: ui/config/output-dev.json ui/dist/index.html
	aws --no-cli-pager s3 sync ui/dist "s3://$$(jq -r .ui_bucket.value $< )"
	aws --no-cli-pager s3 sync --delete ui/dist "s3://$$(jq -r .ui_bucket.value $< )"
	aws --no-cli-pager cloudfront create-invalidation --distribution-id "$$(jq -r .cdn_id.value $<)" --paths '/*'
