# Famiglia CLI

This is a command-line interface (CLI) tool for the MyLists application, built using Commander.js.

## Usage

You can run the CLI using:

```bash
# Using the npm script
npm run cli -- [command] [options]

# Or directly with tsx
npx tsx src/cli/index.ts [command] [options]

# After building
npm run build:cli
node dist/cli/index.js [command] [options]
```

## Available Commands

- `hello`: A simple greeting command
    - Options:
        - `-n, --name <n>`: Name to greet (default: "World")

- `check-user-role`: Check a user's role and details
    - Options:
        - `-i, --id <id>`: User ID to check
        - `-n, --name <name>`: Username to check
    - Note: You must provide either a user ID or username

## Adding New Commands

To add a new command:

1. Create a new file in the `src/cli/commands/` directory (you can use `template.ts` as a starting point)
2. Export a register function like `registerCommandName(program: Command)`
3. Import and register your command in `src/cli/commands/index.ts`

Example new command:

```typescript
// src/cli/commands/mycommand.ts
import {Command} from 'commander';


export function registerMyCommand(program: Command): void {
    program
        .command('mycommand')
        .description('Description of my command')
        .option('-o, --option <value>', 'description of option')
        .action((options) => {
            // Your command implementation here
            console.log('My command executed with options:', options);
        });
}
```

Then update `src/cli/commands/index.ts`:

```typescript
import {Command} from 'commander';
import {registerHelloCommand} from './hello';
import {registerMyCommand} from './mycommand';


export function registerAllCommands(program: Command): void {
    registerHelloCommand(program);
    registerMyCommand(program);
}
```

## Building for Production

To build the CLI for production use:

```bash
npm run build:cli
```

This will compile TypeScript files to JavaScript in the `dist` directory. 