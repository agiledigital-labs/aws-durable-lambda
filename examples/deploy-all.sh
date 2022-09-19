#!/bin/bash
# Thanks http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

#
# Runs through each example and deploys it to test that it is working
#
# Assumes that you have an AWS profile or the correct environment variables
# set up ahead of time. Make sure you environment is pointing at some sort
# of sandbox AWS environment.
#

# Check AWS API setup
aws sts get-caller-identity

# Rebuild plugin

echo "Rebuilding plugin..."
pushd ../plugin
yarn install
yarn build
popd

echo "Deploying examples..."

for dir in ./*
do
    test -d "$dir" || continue
    echo "Deploying '$dir' example..."
    pushd $dir
    # Need to remove node_modules so that the plugin in installed again
    # Packages referred to by a relative path don't seem to update even if changed unless it is forced
    rm -rf node_modules
    yarn install

    yarn sls deploy --stage sandbox --conceal
    popd
done