#!/bin/bash

source .env

gcloud functions deploy $CF_FUNCTION_NAME \
--gen2 \
--trigger-http \
--region=$CF_REGION \
--runtime=$CF_RUNTIME \
--entry-point=$CF_ENTRY_POINT \
--memory=$CF_MEMORY \
--service-account=$CF_SVC_ACCT_EMAIL \
--no-allow-unauthenticated
