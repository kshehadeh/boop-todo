# Boop CLI

A command-line interface application with subcommands built using Commander.js.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/boop.git
cd boop

# Install dependencies
npm install

# Build the project
npm run build

# Link the CLI globally (optional)
npm link
```

## Usage

```bash
# Show help
boop --help

# Initialize a new project
boop init --template react --directory my-project

# Generate a component
boop generate component --name Button

# Deploy to an environment
boop deploy --environment production

# Check deployment status
boop deploy status

# Generate SSL certificates
boop certificate --domain localhost --output ./certs
```

## Available Commands

### init

Initialize a new project with a template.

```bash
boop init [options]

Options:
  -t, --template <template>    Template to use (default: "default")
  -d, --directory <directory>  Directory to initialize in (default: ".")
  -h, --help                   Display help for command
```

### generate (alias: g)

Generate project components.

```bash
boop generate <type> [options]

Arguments:
  type                         Type of component to generate (component, model, service)

Options:
  -n, --name <name>            Name of the component (required)
  -f, --force                  Force overwrite if component exists (default: false)
  -p, --path <path>            Path to generate the component in
  -h, --help                   Display help for command
```

### deploy

Deploy the application to an environment.

```bash
boop deploy [options]

Options:
  -e, --environment <env>      Environment to deploy to (default: "development")
  -v, --verbose                Enable verbose output (default: false)
  --dry-run                    Perform a dry run without actual deployment (default: false)
  -h, --help                   Display help for command

Subcommands:
  status                       Check deployment status
```

### certificate (alias: cert)

Generate SSL certificates using mkcert.

```bash
boop certificate [options]

Options:
  -d, --domain <domain>        Domain name for the certificate (e.g., localhost) (required)
  -o, --output <directory>     Output directory for certificates (default: "./certs")
  --days <days>                Validity period in days (default: "365")
  --organization <name>        Organization name for the certificate
  -f, --force                  Force overwrite if certificates exist (default: false)
  -h, --help                   Display help for command
```

## Examples

### HTTPS Server with Generated Certificates

The repository includes an example HTTPS server that uses certificates generated with the `certificate` command:

```bash
# First, generate certificates for localhost
boop certificate --domain localhost --output ./certs

# Then run the example HTTPS server
node examples/https-server.js
```

This will start a secure HTTPS server on port 3443 that you can access at https://localhost:3443/

## Development

To add a new command, create a new file in the `src/commands` directory and register it in `src/index.ts`.

## License

MIT
