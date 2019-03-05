.PHONY: appengine

appengine-deploy: env
	gcloud --quiet app deploy app.${env}.yaml --no-promote --version="${version}"
