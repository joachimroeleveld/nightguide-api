#!/usr/bin/env bash

VERSION=$1
WORKDIR=${PWD}
PROJECT_NAME="nightguide-api-client-js"
OUTPUT_DIR="temp/js-client"
TAGNAME="v${VERSION}"
REPO="git@github.com:joachimroeleveld/nightguide-api-client-js.git"

if [[ -z "$VERSION" ]] ; then
    echo 'Version must be specified'
    exit 0
fi

mkdir -p ${OUTPUT_DIR}
rm -r "${OUTPUT_DIR}/*"

docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate \
    -i /local/openapi-spec.yae kunt m ml \
    -o /local/${OUTPUT_DIR} \
    -g javascript \
    -DemitModelMethods=true \
    -DusePromises=true \
    -DprojectVersion=${VERSION} \
    -DprojectName=${PROJECT_NAME} \
    -DmodelPropertyNaming=camelCase \
    -DuseES6=true

cd ${OUTPUT_DIR}

#git init

git add -A
git commit --quiet -m ${TAGNAME}
git tag -a ${TAGNAME} -m "Version ${VERSION}"

#git remote add origin ${REPO}
#git pull origin master

#git branch --set-upstream-to=origin/master
git push
git push origin ${TAGNAME}
