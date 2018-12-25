.PHONY: appengine

appengine-deploy: env
	gcloud --quiet --project ${GCP_PROJECT_ID} app deploy app.yaml --promote --version="${version}"
