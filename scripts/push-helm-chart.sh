#!/usr/bin/env bash

CHART_NAME=api-${VERSION//v/}.tgz

helm init --client-only
helm plugin install https://github.com/nouney/helm-gcs
helm repo add repo $REPO
mv chart.tgz $CHART_NAME
helm gcs push $CHART_NAME repo
