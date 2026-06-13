# Ontime MCP Server

Ontime exposes an MCP server over Streamable HTTP.

## Endpoint

Default local URL:

```text
http://localhost:4001/mcp
```

If Ontime is running on another host or port, replace `localhost:4001` with that address.
If `ROUTER_PREFIX` is configured, include it before `/mcp`, for example:

```text
http://localhost:4001/stage/mcp
```

The MCP route is stateless. Clients should send MCP requests with `POST`; `GET` and
`DELETE` are not used.

## Authentication

If Ontime has no session password configured, no MCP authentication is required.

If a session password is configured, authenticate with the hashed Ontime token:

```http
Authorization: Bearer <hashed-token>
```

This is the same token used in authenticated Ontime share URLs as the `token` query
parameter. The raw session password is not accepted as the bearer token.

## Client Configuration

Use a Streamable HTTP MCP client and point it at the MCP endpoint:

```json
{
  "mcpServers": {
    "ontime": {
      "url": "http://localhost:4001/mcp",
      "headers": {
        "Authorization": "Bearer <hashed-token>"
      }
    }
  }
}
```

Omit `headers` when Ontime is not password protected.

## Quick Check

The server should respond to MCP initialization requests at `/mcp`. A plain browser
`GET` request will return `405 Method not allowed`, which is expected.
