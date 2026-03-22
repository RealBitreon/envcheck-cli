# REPL Mode - Interactive Environment Variable Checker

The envcheck REPL (Read-Eval-Print Loop) provides an interactive shell for running environment variable checks with persistent configuration and session management.

## Starting the REPL

Start the REPL in any of these ways:

```bash
# Run without arguments
envcheck

# Explicit REPL flag
envcheck --repl
envcheck -r
```

## Features

### 1. Interactive Command Execution

Run envcheck commands directly without the `envcheck` prefix:

```bash
envcheck> . --format json
envcheck> ./src --fail-on missing
envcheck> . --ignore "**/*.test.js"
```

### 2. Session Management

The REPL maintains session state including:
- Command history
- Previous results
- Persistent configuration
- Session duration tracking

### 3. Persistent Configuration

Set configuration once and it applies to all subsequent commands:

```bash
envcheck> :set format json
envcheck> :set path ./src
envcheck> :set failOn missing
envcheck> .
# Uses format=json, path=./src, failOn=missing
```

### 4. Command System

Special commands start with `:` or `.`:

#### Configuration Commands

```bash
:config                    # Show current configuration
:set <key> <value>        # Set a configuration value
:get <key>                # Get a configuration value
```

Available configuration keys:
- `path` - Directory to scan (default: ".")
- `envFile` - Path to .env.example (default: ".env.example")
- `format` - Output format: text, json, github (default: "text")
- `failOn` - Exit condition: missing, unused, undocumented, all, none (default: "none")
- `noColor` - Disable colors: true, false (default: false)
- `quiet` - Quiet mode: true, false (default: false)

#### History Commands

```bash
:history                   # Show command history with timestamps
:results                   # Show summary of all previous results
:last                      # Show detailed last result
:clear                     # Clear history and results
```

#### Help & Exit

```bash
:help                      # Show REPL help
:exit                      # Exit the REPL
:quit                      # Exit the REPL (alias)
```

## Usage Examples

### Basic Workflow

```bash
$ envcheck
envcheck REPL - Interactive Environment Variable Checker
Type :help for available commands, :exit to quit