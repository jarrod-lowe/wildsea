appsync/graphql.ts: graphql/schema.graphql appsync/node_modules
	if [ -z "$(IN_PIPELINE)" ] ; then \
		docker run --rm --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/appsync --entrypoint ./node_modules/.bin/graphql-code-generator node:20 --config codegen.ts ; \
	else \
		echo Not re-auto-generating types file in pipeline ; \
	fi

appsync/make-schema.js: appsync/make-schema.ts appsync/node_modules
	cd appsync ; esbuild make-schema.ts --bundle --format=esm --platform=node --target=esnext --sourcemap=inline --sources-content=false > make-schema.js

appsync/schema.ts: graphql/schema.graphql appsync/make-schema.js appsync/node_modules
	if [ -z "$(IN_PIPELINE)" ] ; then \
		docker run --rm -i --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/appsync node:20 node ./make-schema.js < $< > $@ ; \
	else \
		echo Not re-auto-generating types file in pipeline ; \
	fi

appsync/node_modules:
	cd appsync ; npm install
