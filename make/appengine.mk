.PHONY: appengine

appengine-deploy: env
	gcloud --quiet --project ${GCP_PROJECT_ID} app deploy app.${_ENV}.yaml --promote --stop-previous-version --version="${version}"
