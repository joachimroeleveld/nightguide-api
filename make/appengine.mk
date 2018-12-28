.PHONY: appengine

appengine-deploy: env
	gcloud --quiet --project ${GCP_PROJECT_ID} app deploy app.${env}.yaml --promote --version="${version}"
