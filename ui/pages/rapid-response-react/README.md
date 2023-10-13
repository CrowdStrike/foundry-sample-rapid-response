# Rapid Response app

This app is built using:

1. [React](https://react.dev/)
2. [React Router](https://reactrouter.com/en/main)
3. [React Hook Form](https://www.react-hook-form.com/)
4. [Zod](https://zod.dev/)
5. [Vite](https://vitejs.dev/)
6. [Vitest](https://vitest.dev/)
7. [Framer Motion](https://www.framer.com/motion/)
8. [Shoelace](https://shoelace.style/)

## Getting started

In the following section, most of the commands need to be run from the **ui app directory** (`foundry-sample-rapid-response/ui/pages/rapid-response-react`), but some commands need to be run from the **foundry app directory** (`foundry-sample-rapid-response`).

| Name                  | Path                                                          | Notes                            |
| --------------------- | ------------------------------------------------------------- | -------------------------------- |
| Foundry app directory | `foundry-sample-rapid-response`                               | Contains the `manifest.yml` file |
| UI app directory      | `foundry-sample-rapid-response/ui/pages/rapid-response-react` | Contains this `README.md` file   |

First, install the dependencies for this app (from the UI app directory):

```
yarn install
```

### Running the app in standalone mode

In standalone mode, the Foundry Bridge is mocked. Calling `falcon.connect()` returns a mock response. API calls and FaaS functions are mocked so as to return fake data. This is useful for UI developers.

To build the app in standalone mode, from the UI app directory run:

```
yarn vite
```

In your browser, visit: [http://localhost:5173/]() (or whichever port Vite advises you to).

### Running the app in developer mode

The Foundry App, a part of Falcon Console, lets you launch pages such as this Rapid Response app. This React app runs inside of an iframe within the Foundry App. (Consider the Foundry app to be the 'host' or 'parent', and this UI Page to be the 'guest' or 'child'). In developer mode, the iframe is loaded with `src="http://localhost:25678"`. You can run a local server on your development machine to serve this UI Page at `localhost:25678`. This allows you to make changes locally, and see them running within the Foundry app.

From the UI app directory, run:

```
yarn dev
```

This compiles the `index.html` and contents of the `src` directory into a bundle in the `foundry-sample-rapid-response/ui/pages/rapid-response-react/dist` directory.

To run the local server, from the Foundry app directory run:

```
foundry ui run
```

This serves the contents of the `foundry-sample-rapid-response/ui/pages/rapid-response-react/dist` directory at `localhost:25678`.

Optionally, if you'd like to run in developer mode using mock data, you can do so:

```
VITE_MOCK_BRIDGE_ENABLED=true yarn dev
```

This is useful for UI developers.

### Deploying the app to foundry

Deploying the app means that it can be run inside the Foundry App by anyone who has access. (No need for a development environment)

**NOTE**: parts of this process have to change depending on which environment you want to deploy to. In particular, take note of the following:

1. The environment variables: `FOUNDRY_API_GW_DOMAIN` and `FOUNDRY_UI_DOMAIN` (these influence the `foundry apps deploy` step)
2. The contents of the `manifest.yml` file in the Foundry app directory
3. Your active `foundry profile`

In the following steps, examples are provided for deploying to the production environment.

First, build the app. From the UI app directory run:

```
yarn build
```

Then deploy the app. From the Foundry app directory run:

```
FOUNDRY_API_GW_DOMAIN=https://api.crowdstrike.com FOUNDRY_UI_DOMAIN=https://falcon.crowdstrike.com foundry apps deploy
```

Note that this will deploy all parts of the Rapid Response app. That includes FaaS functions (from `foundry-sample-rapid-response/functions`), custom storage (from `foundry-sample-rapid-response/storage`), in addition to this React app.

### Analyzing Javascript Bundle

When running

```
yarn build
```

It will create for you a `stats.html` file that will represent the modules and how much space they take.

It's very handy to analyze library size and adjust their size.

### Tests

Tests are written using [Vitest](https://vitest.dev/).

To run the tests, change to the UI app directory directory. Run `yarn install` to fetch dependencies, then:

```
yarn test
```