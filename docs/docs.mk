# Documentation generation targets

# Find all .mmd files in docs/
MERMAID_SOURCES := $(wildcard docs/*.mmd)
MERMAID_SVGS := $(MERMAID_SOURCES:.mmd=.svg)

# Docker image for Mermaid CLI
MERMAID_DOCKER_IMAGE := minlag/mermaid-cli:latest

.PHONY: diagrams
diagrams: $(MERMAID_SVGS)

# Generate SVG from Mermaid diagram using Docker
docs/%.svg: docs/%.mmd
	@echo "Generating diagram: $@"
	@docker run --rm --user $(shell id -u):$(shell id -g) \
		-v $(shell pwd)/docs:/data \
		$(MERMAID_DOCKER_IMAGE) \
		-i /data/$(notdir $<) \
		-o /data/$(notdir $@) \
		-b transparent

.PHONY: clean-diagrams
clean-diagrams:
	rm -f $(MERMAID_SVGS)
