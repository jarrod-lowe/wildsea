graphql/%/appsync.js: graphql/node_modules graphql/%/appsync.ts
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
	cd graphql && npm install

GRAPHQL := $(patsubst %.ts,%.js,$(wildcard graphql/*/*/appsync.ts))

.PHONY: graphql
graphql: $(GRAPHQL)
	echo $(GRAPHQL)
