# Routing and Ontime Cloud

Use for navigation, URLs, endpoints, websockets, auth, cookies, assets, redirects, presets, or local-storage scope.

## Deployment invariant

Support root and runtime-prefixed deployments:

```text
local:  http://localhost:4001/timer
cloud:  https://cloud.example/client-hash/timer
```

Prefix is deployment data. Never assume `/`.

## Client

- `apps/client/src/externals.ts`: derives `baseURI`, `serverURL`, `websocketUrl` from document base/current origin.
- `BrowserRouter`: uses `baseURI` basename.
- APIs/assets: use `common/api/constants.ts` or base-aware helpers.
- App navigation: use React Router. Never strip/guess/re-add prefix from `window.location.pathname`.
- Persisted browser state: use existing base-aware scoping where prefixes need isolation.

## Server

- `updateRouterPrefix()` in `apps/server/src/externals.ts`: normalises `ROUTER_PREFIX`.
- `apps/server/src/app.ts`: mounts routes below that prefix.
- Domain routers: paths relative to mount; never derive prefix.
- Websockets, auth redirects, cookie paths, share URLs: preserve prefix.

## URL rules

Use `URL`, React Router, or existing helpers instead of string manipulation. Preserve:

- leading/trailing slashes and runtime prefix;
- query params, auth tokens, navigation locks;
- preset aliases and canonical view paths;
- `https`/`wss` behind proxies;
- static/user asset paths.

Never infer Ontime Cloud from hostname alone. Generated base markup marks cloud; runtime prefixes also serve non-cloud reverse proxies.

## Cloud capabilities

Gate unavailable local-network integrations in cloud, including OSC output. Keep server behaviour and UI availability aligned.

## Verification

Test both root and a prefix such as `/client-hash`. Include relevant queries, redirects, cookies, websocket paths, presets, assets. Root-only routing coverage is incomplete.
