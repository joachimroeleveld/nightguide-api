SHELL := /bin/bash

PROJECT_PREFIX = nightguide-app
SERVICE_NAME = api
ENVS = dev stg prod

KMS_ARGS=--location=global --keyring=$(SERVICE_NAME) --project=$(PROJECT_PREFIX)-$(env) --key=env --ciphertext-file=env.$(env).enc --plaintext-file=-

env-encrypt: _env-validate _env-file-validate
	cat env.$(env) | gcloud kms encrypt $(KMS_ARGS)

env-decrypt: _env-validate
	gcloud kms decrypt $(KMS_ARGS) > env.$(env)

_env-validate:
ifeq ($(filter $(env),$(ENVS)),)
	@echo "ERROR: env is required. supported: $(ENVS)"
	@exit 1
endif

_env-file-validate:
	@[ -f env.$(env) ] ||  (echo "ERROR: env.$(env) is not found." && exit 1)
