.PHONY: secret

KMS_ARGS=--location=$(GCP_REGION) --keyring=$(SERVICE_NAME) --key=secret-conf --ciphertext-file=secret.$(env).enc --plaintext-file=-

secret-encrypt: env
	tar cvf - $(SECRET_DIR)| gcloud --project=$(GCP_PROJECT_ID) kms encrypt $(KMS_ARGS)

secret-decrypt: env
	gcloud --project=$(GCP_PROJECT_ID) kms decrypt $(KMS_ARGS) | tar vxf  -

