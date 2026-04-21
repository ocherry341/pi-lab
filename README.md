# pi-lab

> **Unofficial** — This is a personal collection of extensions for [pi coding agent](https://github.com/badlogic/pi-mono). It is not affiliated with or endorsed by the official pi project. For the official repository, see [badlogic/pi-mono](https://github.com/badlogic/pi-mono).

A collection of [pi coding agent](https://github.com/badlogic/pi-mono) extensions, packaged for `pi install`.

## Packages

| Package                                           | Description                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [@pi-lab/permissions](./packages/permissions)     | Permission system — enforce allow / deny / ask rules on tool calls                                    |
| [@pi-lab/input-history](./packages/input-history) | Cross-session input history — `↑` recalls the last 100 inputs across all sessions in the same project |
| [@pi-lab/webfetch](./packages/webfetch)           | Fetch any URL and get back clean Markdown, with pagination, inline script index, and LRU cache        |

## Install

Each package can be installed individually:

```bash
pi install npm:@pi-lab/permissions
```

Or pin to a git ref:

```bash
pi install git:github.com/ocherry341/pi-lab@main
```

## Development

```bash
pnpm install

# type-check all packages
pnpm typecheck

# test an extension locally without installing
pi -e ./packages/<name>/src/index.ts

# test the compiled output
cd packages/<name>
pnpm build
pi -e ./dist/index.mjs
```
