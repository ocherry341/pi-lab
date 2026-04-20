# pi-lab

A collection of [pi coding agent](https://shittycodingagent.ai) extensions, packaged for `pi install`.

## Packages

| Package         | Description |
| --------------- | ----------- |
| _(coming soon)_ |             |

## Install

Each package can be installed individually:

```bash
# from npm
pi install npm:@your-scope/<package-name>

# from git
pi install git:github.com/your-username/pi-lab@main
```

Or install a specific package via project settings (`.pi/settings.json`):

```json
{
  "packages": ["npm:@your-scope/<package-name>"]
}
```

## Development

```bash
pnpm install

# typecheck all extensions
pnpm typecheck

# test an extension locally without installing
pi -e ./packages/<name>/extensions/index.ts
```
