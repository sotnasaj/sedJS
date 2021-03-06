#!/usr/bin/env node
const yargs = require('yargs');
const fs = require('fs');
const rl = require('readline');
const fileVal = require('./fileValidator');
const cmd = require('./cmd');

// export.command ¿? export.handler ¿? --read to improve
const argv = yargs
  .usage('Usage: $0 [options] <cmd>')
  .options({
    expression: {
      describe: 'Regex to be executed',
      array: true,
      alias: 'e',
      demandOption: false,
      nargs: 1,
      type: 'string',
    },
    silent: {
      describe: 'Flush the output of the match',
      array: false,
      alias: ['quiet', 'n'],
      demandOption: false,
      nargs: 0,
      type: 'boolean',
      default: false,
    },
    inPlace: {
      describe: 'Substitution in place, for a backup a [suffix] is necessary',
      array: false,
      alias: 'i',
      demandCommand: false,
      nargs: 0,
      type: 'boolean',
      default: false,
    },
    file: {
      describe: 'You can specified a file with commands',
      array: false,
      alias: 'f',
      demandCommand: false,
      type: 'string',
    },
  })
  .command(
    '$0 <path>',
    '***IMPORTANTE , -f <archivo> overrides typed commands',
    (yargs) => {
      yargs.positional('path', {
        describe: 'File to be processed',
        type: 'string',
        array: false,
      });
    }
  )
  .check((yargs) => {
    if (fileVal.checkReadExist(yargs.path)) {
      return true;
    }
    throw new Error('Some files seems to be wrong, give them a check ;) ');
  })
  .check((yargs) => {
    if (yargs.f === undefined) {
      return true;
    } else {
      if (fileVal.checkReadExist(yargs.f)) {
        return true;
      }
      throw new Error(
        'The file with commands seems to be wrong, give it a check ;) '
      );
    }
  })
  .demandCommand(1, 1).argv;

let flags = {
  n: argv.silent,
  i: argv.inPlace,
  e: argv.expression,
  f: argv.file,
};

// By now whe send the [] ready, it is suposed to change
// Executed when -f , meaning that a file with commands is provided
// Also the first positional argument is overrided but required(*Behaviour to be fix)
if (argv.file !== undefined) {
  let commandsF= [];
  let lineReader = rl.createInterface({
    input: fs.createReadStream(argv.f),
  });
  lineReader.on('line', function (line) {
    commandsF.push(line.toString());
  });
  lineReader.on('close', () => {
    if (argv.expression !== undefined) {
      cmd.executeExpression([...commandsF, ...argv.e], argv.path, flags);
    } else {
      cmd.executeExpression(commandsF, argv.path, flags);
    }
  });
}
// Executed when -e argument is provided (or multiple)
// Also the first positional argument is overrided but required (*Behaviour to be fix)
else if (argv.expression !== undefined) {
  cmd.executeExpression(argv.e, argv.path, flags);
}

// if both a and b are not provided,
else {
  console.log(
    'At least one -e command or a file with commands should be provided'
  );
  process.exit();
}
