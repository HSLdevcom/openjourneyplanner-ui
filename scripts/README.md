# Using scripts

See the `themeMap` in `app/configurations/config.default.js` for configuration options.

## Before using
```
source ui.sh
```
## Usage examples

Using remote instance of OTP with subscription key:
```
SUBSCRIPTION_KEY=<your_subscription_key> ui hsl
```
Using local instance of OTP on port `9080`:
```
SUBSCRIPTION_KEY=<your_subscription_key> uiotp matka
```
In case you do not need features usable with a subscription key when running a local instance of OTP on port `9080`:
```
NO_SUBSCRIPTION_KEY=true uiotp matka
```
