SHELL := /bin/bash
export PATH := $(CURDIR)/bin:$(PATH)

SERVICE_NAME = api
ENVS = dev stg prod
SECRET_DIR = .config/secret

include make/env.mk
include make/secret.mk
include make/appengine.mk

setup: | config-set config-auth

config-auth: | _auth_validate
	gcloud auth activate-service-account --key-file .config/secret/gcloud-key.json

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

_auth_validate:
	@[ -f $(SECRET_DIR)/gcloud-key.json ] ||  (echo "ERROR: .secret/gcloud-key.json is not found." && exit 1)
