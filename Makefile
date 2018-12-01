SHELL := /bin/bash
export PATH := $(CURDIR)/bin:$(PATH)

SERVICE_NAME = api
ENVS = dev stg prod
GCP_REGION = europe-west1
SECRET_DIR = .config/secret

include make/env.mk
include make/secret.mk
include make/appengine.mk

.DEFAULT_GOAL=readme

setup: | config-set config-auth sa-setup

config-auth:
	gcloud auth login
	gcloud auth application-default login

config-set: env
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
