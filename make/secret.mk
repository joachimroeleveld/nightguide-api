.PHONY: secret

KMS_ARGS=--location=global --keyring=$(SERVICE_NAME) --key=secret-conf --ciphertext-file=secrets.$(env).enc --plaintext-file=-

secret-encrypt: config-set
	tar cvf - $(SECRET_DIR)| gcloud kms encrypt $(KMS_ARGS)

secret-decrypt: config-set
	mkdir -p $(SECRET_DIR)
	gcloud kms decrypt $(KMS_ARGS) | tar vxf  -

