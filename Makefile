.PHONY: setup up down fresh test lint web preview logs sh

PREVIEW_URL ?= http://localhost:8080

setup: ## First run from a fresh clone: settings, containers, dependencies, demo database
	test -f api/.env || cp api/.env.example api/.env
	test -f .env || printf 'UID=%s\nGID=%s\n' "$$(id -u)" "$$(id -g)" > .env
	docker compose up -d --build
	docker compose exec php composer install
	grep -q '^APP_KEY=base64:' api/.env || docker compose exec php php artisan key:generate
	docker compose exec php php artisan migrate --seed
	npm --prefix web install

up: ## Start the containers (API on http://localhost:8000)
	docker compose up -d

down: ## Stop the containers
	docker compose down

fresh: ## Drop, migrate and load the demo data again
	docker compose exec php php artisan migrate:fresh --seed

test: ## The Pest suite (SQLite in memory)
	docker compose exec php php artisan test

lint: ## PHP style, then the front end's lint, types and build
	docker compose exec php ./vendor/bin/pint --test
	npm --prefix web run lint
	npm --prefix web run build

web: ## The Vite dev server → http://localhost:5174
	npm --prefix web run dev

preview: ## The whole site on one address (port 8080), routed as in production
	sed -e 's|^APP_URL=.*|APP_URL=$(PREVIEW_URL)|' \
	    -e 's|^FRONTEND_URL=.*|FRONTEND_URL=$(PREVIEW_URL)|' \
	    -e 's|^SESSION_DOMAIN=.*|SESSION_DOMAIN=null|' \
	    api/.env > api/.env.preview && mv api/.env.preview api/.env
	VITE_API_URL= npm --prefix web run build
	docker compose --profile preview up -d
	@echo "Construye Fichaje: $(PREVIEW_URL)"

logs: ## Tail the containers' logs
	docker compose logs -f --tail=100

sh: ## A shell in the php container
	docker compose exec php bash
