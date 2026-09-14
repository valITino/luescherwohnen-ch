# Lokale Qualitätsprüfungen (identisch mit der CI-Pipeline).
# `make check` führt alle Prüfungen ohne Netzwerkzugriff auf externe Links aus.

SHELL := /bin/bash
VENV ?= .venv
PYTHON ?= python3
RUFF := $(VENV)/bin/ruff

.PHONY: check install install-browsers build preview lint-md lint-md-fix lint-html lint-py validate test-py test-web links secrets

check: lint-md lint-py validate test-py lint-html test-web secrets

install: node_modules/.package-lock.json $(RUFF)

# Chromium für die Playwright-Tests (einmalig).
install-browsers: node_modules/.package-lock.json
	npx --no-install playwright install chromium

node_modules/.package-lock.json: package-lock.json
	npm ci --ignore-scripts --no-audit --no-fund

$(RUFF): requirements-dev.txt
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/python -m pip install --quiet --require-hashes -r requirements-dev.txt

lint-md: node_modules/.package-lock.json
	npx --no-install markdownlint-cli2

lint-md-fix: node_modules/.package-lock.json
	npx --no-install markdownlint-cli2 --fix

lint-py: $(RUFF)
	$(RUFF) check scripts tests
	$(RUFF) format --check scripts tests

build: node_modules/.package-lock.json
	npm run build

preview: build
	npm run preview

lint-html: build
	npm run lint:html

test-web: build
	npm run test:web

validate:
	$(PYTHON) scripts/validate_claude_config.py

test-py:
	$(PYTHON) -m unittest discover -s tests -p 'test_*.py'

# Benötigt das lychee-Binary (https://github.com/lycheeverse/lychee/releases).
links:
	lychee --config lychee.toml '**/*.md'

secrets:
	scripts/secret_scan.sh
