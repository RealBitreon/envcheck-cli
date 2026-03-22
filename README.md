# envcheck-cli

## The Origin Story (Or: How Coffee Led to Code)

So there I was, sitting on my sofa, sipping my coffee on a perfectly ordinary Saturday morning. You know that moment when the caffeine hits just right and your brain suddenly decides to replay every production incident from the past year? Yeah, that happened.

I was thinking about *that one time* when the staging environment exploded because someone added `DATABASE_URL` to the code but forgot to document it in `.env.example`. The new dev spent three hours debugging why their local setup wouldn't work. Three. Hours. For a missing environment variable.

My coffee was getting cold as I stared at the ceiling, and I thought: "Why isn't there a tool that just... checks this stuff?" You know, something that scans your code, looks at what env vars you're actually using, and yells at you if they're not documented. Something simple. Something that doesn't require installing half of npm to work.

So I did what any reasonable developer does when caffeinated and slightly annoyed: I built it.

And thus, envcheck-cli was born. From a sofa. With lukewarm coffee. Living its best life as a zero-dependency CLI tool that saves developers from the ancient curse of undocumented environment variables.

## What This Thing Actually Does

envcheck scans your codebase and compares environment variable usage against your `.env.example` file. It's like a spell-checker, but for env vars. It catches three types of problems:

- **MISSING** - You're using `process.env.SECRET_API_KEY` in your code, but `.env.example` has never heard of it. Rookie mistake.
- **UNUSED** - You documented `LEGACY_FEATURE_FLAG` in `.env.example`, but it's not referenced anywhere. Time to clean house.
- **UNDOCUMENTED** - The variable exists and is used, but there's no comment explaining what it does. Future you will hate present you for this.

## Why You Might Actually Want This

- **Zero dependencies** - Seriously. None. Just Node.js built-ins. Your `node_modules` folder thanks me.
- **Multi-language support** - JavaScript, TypeScript, Python, Go, Ruby, Rust, Shell scripts. I got you.
- **Multiple output formats** - Human-readable text, JSON for your scripts, GitHub Actions annotations for your CI/CD pipeline.
- **Actually fast** - No AI, no blockchain, no unnecessary complexity. Just good old-fashioned file scanning.
- **CI/CD ready** - Configurable failure conditions so you can enforce env var hygiene in your pipeline.
- **Interactive REPL** - Explore and fix issues in an interactive shell with tab completion and command history.
- **Watch mode** - Automatically rerun validation when files change during development.
- **Auto-fix** - Automatically add missing variables to .env.example with smart defaults.
- **Intelligent suggestions** - Get actionable hints including typo detection and smart example values.
- **Configuration files** - Save your settings in `.envcheckrc.json` for consistent team workflows.

## Supported Languages

Because not everyone writes JavaScript (shocking, I know):

- JavaScript/TypeScript (`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`)
- Python (`.py`)
- Go (`.go`)
- Ruby (`.rb`)
- Rust (`.rs`)
- Shell/Bash (`.sh`, `.bash`, `.zsh`)

## Requirements

- Node.js 18.0.0 or higher (because we're living in the future)

## Installation

```bash
npm install -g envcheck-cli
```

Or run it directly without installing:

```bash
npx envcheck-cli
```

## Quick Start

The simplest way to use envcheck:

```bash
envcheck
```

That's it. It scans your current directory, checks your `.env.example`, and tells you what's wrong. But there's more if you need it.

## The Evolution: From Simple to Powerful

### Act I: The Basic Scan

You run `envcheck` and it does its thing. Finds missing vars, unused vars, undocumented vars. Clean output. Done.

```bash
envcheck
```

But then you think: "What if I could just... stay in here? Like a conversation?"

### Act II: The Interactive Mode

So we built a REPL. Because sometimes you want to poke around, try different settings, see what happens.

```bash
envcheck --repl
```

Now you're in an interactive shell. Type `:help` and discover you can:
- Change settings on the fly (`:set format json`)
- View your command history (`:history`)
- Get smart suggestions (`:suggest`)
- Save your config for later (`:save`)

It's like having a conversation with your environment variables. Weird, but useful.

### Act III: The "I'm Coding Right Now" Mode

You're deep in the zone. Writing code. Adding env vars. You don't want to keep running commands manually.

```bash
envcheck --watch
```

Now it watches your files. Every time you save, it checks again. Instant feedback. No context switching. Just code and know.

### Act IV: The "Just Fix It Already" Button

You've got 15 missing variables. You know they need to be in `.env.example`. You don't want to type them all out.

```bash
envcheck --fix
```

Done. It adds them for you. With smart defaults:
- Sees `API_KEY`? Suggests `your_api_key_here`
- Sees `DATABASE_URL`? Suggests `postgres://localhost:5432/dbname`
- Sees `PORT`? Suggests `3000`

It's not magic. It's just pattern matching. But it feels like magic at 11 PM.

### Act V: The "Did You Mean...?" Feature

You typed `DATABSE_URL` instead of `DATABASE_URL`. We've all been there.

```bash
envcheck
```

Output:
```
💡 Did you mean 'DATABASE_URL' instead of 'DATABSE_URL'? (91% similar)
```

It's like autocorrect, but for environment variables. And it doesn't change "duck" to something embarrassing.

### Act VI: The Team Player

Your team needs consistency. Everyone should use the same settings. So you create a config file:

```json
{
  "path": ".",
  "envFile": ".env.example",
  "failOn": "missing",
  "ignore": ["node_modules/**", "**/*.test.js"]
}
```

Save it as `.envcheckrc.json`. Commit it. Now everyone's on the same page. No more "but it works on my machine" because of env var issues.

## Real-World Scenarios (Or: How People Actually Use This)

### Scenario 1: The New Developer

Sarah joins your team. She clones the repo, runs `npm install`, starts the app. It crashes. "What env vars do I need?"

With envcheck:
```bash
envcheck
```

She sees exactly what's missing. Copies them to her `.env`. App starts. She's productive in 5 minutes instead of 50.

### Scenario 2: The Refactoring Session

You're removing an old feature. Delete a bunch of code. But did you remove the env vars from `.env.example`?

```bash
envcheck
```

"Found 3 unused variables." Clean them up. Keep your config lean.

### Scenario 3: The CI/CD Pipeline

Your staging environment broke because someone forgot to document a new env var. Again.

Add to your GitHub Actions:
```yaml
- run: envcheck --format github --fail-on missing
```

Now the PR won't merge until all env vars are documented. Problem solved.

### Scenario 4: The Late Night Coding Session

It's 2 AM. You're in the zone. Adding features. Adding env vars. You don't want to break your flow.

```bash
envcheck --watch
```

Terminal in the corner. Updates automatically. You see issues as they happen. Fix them before you forget.

### Scenario 5: The "I'll Do It Later" Moment

You added 10 new env vars. You know you need to document them. But typing them all out? Ugh.

```bash
envcheck --fix
```

It adds them all with smart defaults. You just need to update the descriptions. 2 minutes instead of 20.

## All The Flags (For When You Need Control)

```bash
envcheck [path] [options]
```

**The Essentials:**
- `--env-file <path>` - Check against a different env file (like `.env.production.example`)
- `--format json` - Output as JSON (for scripts and tools)
- `--format github` - GitHub Actions annotations (for CI/CD)
- `--fail-on missing` - Exit with code 1 if issues found (for CI/CD)

**The Power User Stuff:**
- `--watch` - Auto-rerun on file changes (for development)
- `--fix` - Auto-add missing vars to .env.example (for lazy days)
- `--repl` - Interactive mode (for exploration)
- `--config <path>` - Load settings from file (for teams)
- `--ignore "**/*.test.js"` - Skip certain files (repeatable)

**The "Make It Quiet" Options:**
- `--quiet` - Only show output if there are issues
- `--no-color` - Plain text (for logs and scripts)
- `--no-suggestions` - Skip the helpful hints
- `--no-progress` - No spinners or progress bars

**The Obvious Ones:**
- `--help` - Show help message
- `--version` - Show version number

## Making It Part of Your Workflow

### The Pre-commit Hook (Catch Issues Before They're Committed)

Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh
envcheck . --fail-on missing --quiet
```

Now you can't commit code that uses undocumented env vars. Your future self says thanks.

### The GitHub Action (Catch Issues Before They're Merged)

Add to `.github/workflows/ci.yml`:
```yaml
- name: Check environment variables
  run: envcheck . --format github --fail-on all
```

PRs with missing env vars won't pass CI. No more "works on my machine" surprises in production.

### The npm Script (For Your Team)

Add to `package.json`:
```json
{
  "scripts": {
    "env:check": "envcheck .",
    "env:watch": "envcheck . --watch",
    "env:fix": "envcheck . --fix",
    "pretest": "envcheck . --fail-on missing"
  }
}
```

Now everyone knows how to check env vars. `npm run env:check`. Simple.

### The Docker Build (Fail Fast in Containers)

Add to your `Dockerfile`:
```dockerfile
RUN npm install -g envcheck
RUN envcheck . --fail-on all
```

If env vars are misconfigured, the build fails. Better to know during build than during deploy.

## Want More?

The docs have the deep stuff:
- [CLI Reference](docs/CLI_REFERENCE.md) - Complete command-line flag documentation
- [Configuration Guide](docs/CONFIGURATION.md) - All the settings, explained
- [Examples](docs/EXAMPLES.md) - Real-world use cases and patterns
- [Integrations](docs/INTEGRATIONS.md) - CI/CD platform setup guides
- [REPL Guide](docs/REPL.md) - Interactive mode deep dive
- [Advanced Features](docs/ADVANCED.md) - Plugins, caching, performance tuning
- [Architecture](docs/ARCHITECTURE.md) - How it works under the hood

## The Bottom Line

envcheck started as a simple tool to solve a simple problem: keeping `.env.example` in sync with your code.

Then we added a REPL because sometimes you want to explore.
Then watch mode because developers hate context switching.
Then auto-fix because typing is tedious.
Then smart suggestions because typos happen.
Then config files because teams need consistency.

It's still zero dependencies. It's still fast. It's still simple at its core.

But now it's also powerful when you need it to be.

---

**Pro tip:** Start with just `envcheck`. When you need more, the features are there. When you don't, they stay out of your way.

Built with ☕, mild frustration, and the belief that developer tools should be both simple and powerful.
