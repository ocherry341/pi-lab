# pi-lab

A collection of [pi coding agent](https://shittycodingagent.ai) extensions, packaged for `pi install`.

## Packages

| Package | Description |
|---------|-------------|
| [@pi-lab/permissions](./packages/permissions) | Permission system — enforce allow / deny / ask rules on tool calls |

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

## Repository structure

```
packages/
└── permissions/     # @pi-lab/permissions
    ├── src/         # TypeScript source
    ├── dist/        # compiled output (not committed)
    └── package.json
```
