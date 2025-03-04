#!/usr/bin/env node

import { Command } from 'commander';
import today from './commands/today';
import create from './commands/create';
import complete from './commands/complete';
import summary from './commands/summary';
import login from './commands/login';
import start from './commands/start';
import ai from './commands/ai';
import about from './commands/about';
// Create the main program
const program = new Command();

// Set up basic information
program
    .name('boop')   
    .description('A Todoist CLI with purpose')
    .version('1.0.0');

// Register all subcommands
today(program);
create(program);
complete(program);
summary(program);
login(program);
start(program);
ai(program);
about(program);

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
} 