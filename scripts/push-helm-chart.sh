#!/usr/bin/env bash

CHART_NAME=${VERSION//v/}

helm init --client-only
helm plugin install https://github.com/nouney/helm-gcs
helm repo add repo $REPO
helm gcs push api-$CHART_NAME.tgz repo
