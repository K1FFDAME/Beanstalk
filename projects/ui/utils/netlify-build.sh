#!/usr/bin/env sh

bs_root=$PROJECT_CWD
ui_root=$bs_root/projects/ui

cd $ui_root

export VITE_NAME=$npm_package_name 
export VITE_VERSION=$COMMIT_REF 
export VITE_HOST='netlify' 
export VITE_NETLIFY_CONTEXT=$CONTEXT 
export VITE_NETLIFY_BUILD_ID=$BUILD_ID 
export VITE_GIT_COMMIT_REF=$COMMIT_REF 

echo "VITE_NAME=$VITE_NAME"
echo "VITE_VERSION=$VITE_VERSION"
echo "VITE_NETLIFY_CONTEXT=$VITE_NETLIFY_CONTEXT"
echo "VITE_NETLIFY_BUILD_ID=$VITE_NETLIFY_BUILD_ID"

yarn build