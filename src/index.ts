#!/usr/bin/env node

import { Command } from 'commander';
import today from './commands/today';
import create from './commands/create';
import complete from './commands/complete';
import summary from './commands/summary';

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

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
} 