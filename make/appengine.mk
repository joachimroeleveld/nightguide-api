.PHONY: appengine

appengine-deploy: config-set
	gcloud --quiet app deploy app.${env}.yaml --no-promote --version="${version}"
