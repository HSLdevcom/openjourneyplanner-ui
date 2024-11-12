## Want to get started quickly?
- [Run application in Docker](Docker.md).

## Install requirements

You need [Node](https://nodejs.org/), [Yarn](https://yarnpkg.com) (or npm) and watchman.

- `node -v` should be >= 18.x, >= 20.x is recommended (version 18.20.2 and 20.13.1 is known to work)
  - We recommend that you use [`nvm`](https://github.com/nvm-sh/nvm) to install a specific Node.js version. Optionally, you can also set up [its automatic version switching shell integration](https://github.com/nvm-sh/nvm/tree/e6fa80cb6178ff4e9735265281b5eae811f05f11#deeper-shell-integration).
- `yarn --version` should be >= 3 (version 3.4.1 is known to work). The project will then use yarn 3 from the included file.

You also need a C compiler:
- Linux: GCC 4.6 or later
- OS X: Xcode 5.0 or later
- Windows: for example MSVC 2013 Express

### WSL
To use Windows Subsystem for Linux in digitransit-ui development you may need to do at least the following
1. Add the following to your `/etc/hosts`. This is because the project uses ipv6 compliant `::1` instead of ipv4 style `0.0.0.0`:
```
::1     ip6-localhost ip6-loopback localhost
``` 
2. Add the following to your `/etc/wsl.conf` if not yet present. This prevents WSL from regenerating the `/etc/hosts` as well as the `/etc/resolv.conf`:
```
[network]
generateResolvConf=false
generateHosts = false
```

## Install watchman

### Version

A bit newer version of watchman is now required and 4.9.0 is no longer supported.
Working versions include at least 
- 20220320.140531.0
- 20240407.093313.0

### OS X

`brew install watchman`

### Other

It's possible to run prebuilt binaries from [some release](https://github.com/facebook/watchman/releases)
with [these instructions](https://facebook.github.io/watchman/docs/install.html#prebuilt-binaries-2)
or in some systems to build the binaries from code following
[these instructions](https://facebook.github.io/watchman/docs/install.html#-building-from-source).

## Installation
- `yarn install && yarn setup`

## Start development version

- OSX / Linux: `yarn run dev`
- Windows: `npm run dev-win-national`
- open: http://localhost:8080

## Start production version
- First run: `yarn run build`, then run: `yarn run start`
- open: http://localhost:8080

Note: on Windows, add "win-" prefix to the run commands above. For example: `npm run win-build`.
The same applies to other npm run commands below.

## Modifying sub-modules and components

After you have changed the files in `digitransit-components` you have to re-run `yarn setup` to build those modules
and apply the changes.

## Analyse webpack bundle
- run: `webpack -p --json > digitransit.json`
- Upload `digitransit.json` to `http://webpack.github.io/analyse/`

Or you can also use this:
- https://github.com/robertknight/webpack-bundle-size-analyzer

## Using Git Hooks
Husky (npm-package) is used for setting up the git hooks (`.git/hooks/`) that will allow custom scripts to be run on the repository.
Look up 'husky' in `package.json` to see the details.

## Configuration application
Digitransit ui can be configured in multiple ways. You can
- Change between National and Regional versions using `CONFIG` parameter
  - Alternatively, use `BASE_CONFIG` if server is supposed to serve multiple configurations which have same base configuration. It is used server side at start up and request's host specific config based on `host` or `x-forwarded-host` header is merged into it before returning config to client.
- Switch API backend using `API_URL` parameter
- Enable Sentry client side error monitoring using `SENTRY_*` parameters

Note that you can combine multiple configuration parameters.

### Changing National/Regional version (optional)
Start national version
- `yarn run build`
- `yarn run start`

Start HSL version
- `yarn run build`
- `CONFIG=hsl yarn run start`

### Changing urls for OpenTripPlanner, Geocoding, Service alerts and Vehicle positions (optional)
By default digitransit-ui uses services from https://dev-api.digitransit.fi but you can override API server like so:
- `yarn run build`
- `API_URL=https://api.digitransit.fi yarn run start`

If you want to specify different URL (not just base URL) for individual services, you can define variables OTP_URL, MAP_URL and/or GEOCODING_BASE_URL (URL path before /search or /reverse).
- `yarn run build`
- `GEOCODING_BASE_URL=https://api.digitransit.fi/geocoding/v1 OTP_URL=https://api.digitransit.fi/routing/v2/finland/ yarn run start`

### Using Sentry to track client errors (optional)
Sentry can be configured like so:
- `yarn run build`
- `SENTRY_DSN=https://xxxxx@app.getsentry.com/zzzzz SENTRY_SECRET_DSN=https://xxxx:yyyy@app.getsentry.com/zzzzz yarn run start`

### Configuring static message URL with env variable
- `STATIC_MESSAGE_URL=https://dev-yleisviesti.digitransit.fi yarn run start`
