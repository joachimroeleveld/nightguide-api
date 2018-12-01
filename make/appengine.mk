.PHONY: appengine

appengine-deploy: env secret-decrypt
	gcloud auth activate-service-account --key-file .config/secret/gcloud-key.json
	gcloud --quiet --project ${GCP_PROJECT_ID} app deploy app.yaml --promote --version="${version}"
