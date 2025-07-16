graphql/%/appsync.js: graphql/node_modules graphql/%/*.ts appsync/graphql.ts appsync/schema.ts graphql/environment.json $(wildcard graphql/lib/*.ts)
	echo $(GRAPHQL_TS)
	echo $(GRAPHQL_JS)
	cd graphql && \
	esbuild $*/*.ts \
		--bundle \
		--external:"@aws-appsync/utils" \
		--format=esm \
		--platform=node \
		--target=esnext \
		--sourcemap=inline \
		--sources-content=false \
		--outfile=$*/appsync.js

.PRECIOUS: graphql/environment.json
graphql/environment.json:	
	echo '{"name":"$(ENVIRONMENT)"}' >$@

graphql/node_modules: graphql/package.json
	cd graphql && npm install && npm ci \

GRAPHQL_TS := $(wildcard graphql/function/*/*.ts) $(wildcard graphql/mutation/*/*.ts) $(wildcard graphql/query/*/*.ts) $(wildcard graphql/subscription/*/*.ts)
GRAPHQL_JS := $(foreach file,$(GRAPHQL_TS),$(dir $(file))appsync.js)
GRAPHQL_DEV := graphql-eslint graphql-test

.PHONY: graphql
graphql: $(GRAPHQL_JS) appsync/graphql.ts appsync/schema.ts graphql-test
	echo $(GRAPHQL_JS)

.PHONY: graphql-test
graphql-test: graphql/node_modules appsync/graphql.ts appsync/schema.ts graphql/environment.json
	if [ -z "$(IN_PIPELINE)" ] ; then \
		docker run --rm --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/graphql --entrypoint ./node_modules/jest/bin/jest.js node:20 --coverage ; \
	else \
		cd graphql && ./node_modules/jest/bin/jest.js --coverage ; \
	fi

# Won't auto-fix in pipeline
.PHONY: graphql-eslint
graphql-eslint: $(GRAPHQL_TS)
	if [ -z "$(IN_PIPELINE)" ] ; then \
		docker run --rm --user $$(id -u):$$(id -g) -v $(PWD)/graphql:/code pipelinecomponents/eslint eslint --fix ; \
	else \
		cd graphql && eslint ; \
	fi
