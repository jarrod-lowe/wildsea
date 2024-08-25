graphql/%/appsync.js: graphql/node_modules graphql/%/appsync.ts appsync/graphql.ts appsync/schema.ts
	cd graphql && \
	esbuild $*/*.ts \
		--bundle \
		--external:"@aws-appsync/utils" \
		--format=esm \
		--platform=node \
		--target=esnext \
		--sourcemap=inline \
		--sources-content=false \
		--outdir=$*

graphql/node_modules: graphql/package.json
	cd graphql && npm install && npm ci \

GRAPHQL_TS := $(wildcard graphql/*/*/appsync.ts)
GRAPHQL_JS := $(patsubst %.ts,%.js,$(GRAPHQL_TS))
GRAPHQL_DEV := graphql-eslint graphql-test

.PHONY: graphql
graphql: $(GRAPHQL_JS) appsync/graphql.ts appsync/schema.ts graphql-test
	echo $(GRAPHQL_JS)

.PHONY: graphql-test
graphql-test: graphql/node_modules appsync/graphql.ts appsync/schema.ts
	if [ -z "$(IN_PIPELINE)" ] ; then \
		docker run --rm -it --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/graphql --entrypoint ./node_modules/jest/bin/jest.js node:20 --coverage ; \
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