.PHONY: secret

SA_NAME=service-${SERVICE_NAME}
KMS_ARGS=--location=global --keyring=$(SERVICE_NAME)-$(env) --key=$(SERVICE_NAME)-secret --ciphertext-file=secret.$(env).enc --plaintext-file=-

sa-setup: env
	gcloud iam service-accounts create $(SA_NAME) --display-name="service-$(SERVICE_NAME)"
	gcloud iam service-accounts keys create .config/secret/gcloud-key.json --iam-account $(SA_NAME)@$(GCP_PROJECT_ID).iam.gserviceaccount.com
	gcloud iam service-accounts add-iam-policy-binding ${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
	--member='serviceAccount:${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com' \
	--role='roles/editor'

# KMS setup, to be executed once
kms-setup: env
	gcloud services enable cloudkms.googleapis.com
	gcloud kms keyrings create $(SERVICE_NAME)-$(env) --location global
	gcloud kms keys create $(SERVICE_NAME)-secret --location global --keyring $(SERVICE_NAME)-$(env) --purpose encryption

secret-encrypt: env
	tar cvf - $(SECRET_DIR)| gcloud --project=$(GCP_PROJECT_ID) kms encrypt $(KMS_ARGS)

secret-decrypt: env
	gcloud --project=$(GCP_PROJECT_ID) kms decrypt $(KMS_ARGS) | tar vxf  -

