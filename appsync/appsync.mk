appsync/graphql.ts: graphql/schema.graphql
	if [ -z "$(IN_PIPELINE)" ] ; then \
		docker run --rm -it --user $$(id -u):$$(id -g) -v $(PWD):/app -w /app/appsync --entrypoint ./node_modules/.bin/graphql-code-generator node:20 --config codegen.ts ; \
	else \
		echo Not re-auto-generating types file in pipeline ; \
	fi
