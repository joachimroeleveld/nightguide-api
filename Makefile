SHELL := /bin/bash
export PATH := $(CURDIR)/bin:$(PATH)

SERVICE_NAME = api
ENVS = dev stg prod

KMS_ARGS=--location=global --keyring=$(SERVICE_NAME) --project=$(GCP_PROJECT_ID) --key=env --ciphertext-file=env.$(env).enc --plaintext-file=-

env: | _env-validate
	$(eval include env.$(env))

env-encrypt: config-set
	cat env.$(env) | gcloud kms encrypt $(KMS_ARGS)

env-decrypt: config-set
	gcloud kms decrypt $(KMS_ARGS) > env.$(env)

config-set: | env
	gcloud config set project $(GCP_PROJECT_ID)
	gcloud config set compute/zone $(GCP_REGION)

config-show: | env
	@echo
	@echo '========= Current config =========='
	@echo 'env: $(env)'
	@echo 'project: $(GCP_PROJECT_ID)'
	@echo 'zone: $(GCP_REGION)'
	@echo
	@echo '========= Current gcloud config =========='
	gcloud config list

_env-validate:
	@[ -f env.$(env) ] ||  (echo "ERROR: env.$(env) is not found." && exit 1)

