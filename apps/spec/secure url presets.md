We want to provide a unified way for users to share access to Ontime.

## Requirements

- access can include view configuration
- access can include access password
- user can choose for the shared URL to be untemperable (? maybe not a word)

## User flow

A studio wants to share the cuesheet view with a client, so that they can input data ahead of time.

It is important that the studio can control which columns can the client view and edit.

1. The studios producer creates the project in Ontime.
2. They will then navigate to the cuesheet and visually set the columns that should be visible and other possible cuesheet options.
3. The user then clicks a "Create guest link" which shows a next dialog with the following options:

- lock configuration
- include password
- set password

4. The interface generates both a link and a QR code that can be shared with the client.

## Extension

## Specification details

- in the cuesheet special case, the editable columns are a subset of the viewable columns
- the feature should leverage the URL presets feature

```ts
type URLPreset = {
  enabled: boolean;
  alias: string;
  password?: string;
  pathAndParams: string;
  obscureParams: boolean;
};
```

### Strategy

For an incoming request eg: `www.ontime.com/test`
The request is intercepted by authenticate middleware

1. we check if check if the session in password protected
2. we check if the URL (alias) is password protected

Users can login with a session password or alias password
Password hash can be in URL

Users are moved through to get the app if the password is valid
Otherwise they are redirected to the login page

