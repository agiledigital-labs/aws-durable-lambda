#!/bin/bash
# Thanks http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

source './assert.sh'
#
# Runs through each example deployed with "deploy-all.sh" and 
# gives each a smoke test by calling the deployed API and checking
# that the long running task completes.
#
# Probably best called with a timeout.
# E.g. `timeout 12h bash validate-all.sh'`
#


REGION="${AWS_DEFAULT_REGION:=ap-southeast-2}"
STAGE="${STAGE:-sandbox}"
POLL_PERIOD=5

for dir in *
do
    test -d "$dir" || continue
    API_NAME="adl-example-$dir-sandbox"
    echo "Validating '$API_NAME' API..."
    API_NAME_QUERY="items[?name==\`${API_NAME}\`].[id]"
    API_ID=`aws apigateway get-rest-apis --query "${API_NAME_QUERY}" --output text`
    if [ -z "$API_ID" ]
    then
        echo "No API ID found with name '${API_NAME}'. Skipping..."
        continue
    fi
    echo "Found API ID: '${API_ID}'"

    echo "Retrieving API key..."
    API_KEY=`aws apigateway get-api-keys --name-query adl-example-serverless-esbuild --include-values --query "items[0].[value]" --output text`
    echo "API key retrieved."

    API_BASE_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
    STATUS_URL=`curl --fail --silent --show-error -X POST -H 'API_KEY: ${API_KEY}' "${API_BASE_URL}/create-task/${API_NAME}-myFunction" -d '{ "input": "hello world!" }' | jq -r ".statusUrl"`
    
    echo "Polling for status every [${POLL_PERIOD}] seconds..."
    
    STATUS="Unknown"
    TARGET_STATUS="Completed"
    TARGET_RESPONSE="HELLO WORLD!"
    until [ "$STATUS" == "Completed" ]
    do
        sleep "${POLL_PERIOD}"
        TASK_DATA=`curl --fail --silent --show-error -H 'API_KEY: ${API_KEY}' "${STATUS_URL}"`
        STATUS=`jq -r ".[0].Status" <<< "${TASK_DATA}"`
        RESPONSE=`jq -r ".[0].Response // empty | fromjson | .transformedInput" <<< "${TASK_DATA}"`
        echo "Status is: '${STATUS}'. Waiting for '${TARGET_STATUS}'"
    done
    echo "Status is '${TARGET_STATUS}'. Looks like the durable lambda completed. Verifying response..."
    assert_eq "$RESPONSE" "$TARGET_RESPONSE" "Response should be the input payload in uppercase"
    echo "Response looks OK!"
done