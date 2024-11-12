#!/usr/bin/env bash

ui () {
    if [ "$SUBSCRIPTION_KEY" = "" -a "$NO_SUBSCRIPTION_KEY" != "true" ]; then
        echo "In order to use the UI you need to set the SUBSCRIPTION_KEY environment variable."
        echo "If you want to run the UI without a subscription key, set NO_SUBSCRIPTION_KEY=true."
        return 1 2>/dev/null
    fi
    CONFIG=$1 API_SUBSCRIPTION_QUERY_PARAMETER_NAME=digitransit-subscription-key API_SUBSCRIPTION_HEADER_NAME=digitransit-subscription-key API_SUBSCRIPTION_TOKEN=$SUBSCRIPTION_KEY yarn run dev
}

uiotp () {
    if [ "$1" = "hsl" ]; then
        OTP_URL=http://localhost:9080/otp/ ui hsl
    elif [ "$1" = "matka" ]; then
        OTP_URL=http://localhost:9080/otp/ ui matka
    elif [ "$1" = "kela" ]; then
        OTP_URL=http://localhost:9080/otp/ ui kela
    else
        OTP_URL=http://localhost:9080/otp/ ui $1
    fi
}
