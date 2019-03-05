.PHONY: secret

KMS_ARGS=--location=$(GCP_REGION) --keyring=$(SERVICE_NAME) --key=secret-conf --ciphertext-file=secret.$(env).enc --plaintext-file=-

secret-encrypt: env
	tar cvf - $(SECRET_DIR)| gcloud kms encrypt $(KMS_ARGS)

secret-decrypt: env
	mkdir -p $(SECRET_DIR)
	gcloud kms decrypt $(KMS_ARGS) | tar vxf  -

