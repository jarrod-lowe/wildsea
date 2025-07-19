UI_JQ_FILTER := { \
	identity_pool: .cognito_identity_pool_id.value, \
	user_pool: .cognito_user_pool_id.value, \
	web_client: .cognito_web_client_id.value, \
	graphql: .graphql_uri.value, \
	region: .region.value, \
	loginDomain: .cognito_login_domain.value \
}

ifndef IN_PIPELINE
ui/config/output-%.json: terraform/environment/wildsea-%/.apply
	cd $(dir $^) ; terraform output -json | tee ../../../$@
endif

ui/config/config-%.json: ui/config/output-%.json
	jq "$(UI_JQ_FILTER)" $< >$@

.PHONY: ui-local
ui-local: ui/config/config-dev.json appsync/schema.ts appsync/graphql.ts terraform/environment/wildsea-dev/.apply ui/node_modules
	cp $< ui/public/config.json
	docker run --rm -it --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/ui -p 5173:5173 node:20 npm run dev

ui/node_modules: ui/package.json
	if [ -z "$(IN_PIPELINE)" ] ; then \
		docker run --rm --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/ui --network host node:20 npm install --userconfig=/dev/null --cache=/app/ui/.npm-cache ; \
	else \
		cd ui ; npm install ; \
	fi

ui/.build-%: appsync/schema.ts appsync/graphql.ts ui/src/*.ts ui/src/amplifyconfiguration.json ui/index.html ui/node_modules
	cp ui/config/config-$*.json ui/public/config.json
	if [ -z "$(IN_PIPELINE)" ] ; then \
		docker run --rm --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/ui --network host node:20 npm run build ; \
	else \
		cd ui ; npm run build ; \
	fi
	touch $@

ui/.push: ui-test ui/.push-dev
	touch $@

# We really should run this as RW_ROLE on a make dev...
ui/.push-%: ui/config/output-%.json ui/config/config-%.json ui/.build-%
	aws --no-cli-pager s3 sync ui/dist "s3://$$(jq -r .ui_bucket.value $< )"
	aws --no-cli-pager s3 sync --delete ui/dist "s3://$$(jq -r .ui_bucket.value $< )"
	aws --no-cli-pager cloudfront create-invalidation --distribution-id "$$(jq -r .cdn_id.value $<)" --paths '/*'
	touch $@

.PHONY: ui-test
ui-test: ui/node_modules
	if [ -z "$(IN_PIPELINE)" ] ; then \
		docker run --rm --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/ui --entrypoint ./node_modules/.bin/jest node:20 --coverage ; \
	else \
		cd ui && ./node_modules/.bin/jest --coverage ; \
	fi
