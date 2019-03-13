#!/usr/bin/env bash

CHART_VERSION=${VERSION//v/}

helm init --client-only
helm plugin install https://github.com/nouney/helm-gcs
helm repo add repo $REPO
helm package infra/helm/api
helm gcs push infra/helm/api-$CHART_VERSION.tgz repo
