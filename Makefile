SHELL := /bin/bash

PROJECT_PREFIX = nightguide-app
SERVICE_NAME = api
ENVS = dev stg prod

KMS_ARGS=--location=global --keyring=$(SERVICE_NAME) --project=$(PROJECT_PREFIX)-$(env) --key=env --ciphertext-file=env.$(env).enc --plaintext-file=-

env-encrypt:
	cat env.$(env) | gcloud kms encrypt $(KMS_ARGS)

env-decrypt:
	gcloud kms decrypt $(KMS_ARGS) > env.$(env)

_env-validate:
	@[ -f env.$(env) ] ||  (echo "ERROR: env.$(env) is not found." && exit 1)

