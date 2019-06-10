"use strict";

const log = require('loglevel'),
    Helper = require('./app/helper');

require('loglevel-prefix-persist/server')(process.env.NODE_ENV, log, {
    level: {
        production: 'debug',
        development: 'debug'
    },
    persist: 'debug',
    max: 5
});

log.setLevel('debug');

const privateSettings = require('./data/private-settings'),
    Commando = require('discord.js-commando'),
    Discord = require('discord.js'),
    Client = new Commando.Client({
        owner: privateSettings.owner,
        restWsBridgeTimeout: 10000,
        restTimeOffset: 1000
    }),
    DB = require('./app/db.js');

Client.registry.registerDefaultTypes();

Client.registry.registerGroup('moderation', 'Moderation');
Client.registry.registerGroup('util', 'Utility');
Client.registry.registerGroup('commands', 'Command');

Client.registry.registerDefaultCommands({help: false, prefix: false, eval: false});
Client.registry.registerCommands([
    require('./commands/filter'),
    require('./commands/filtered'),
    require('./commands/disable'),
    require('./commands/add-response'),
    require('./commands/remove-response'),
    require('./commands/responses')
]);

let isInitialized = false;

Client.on('ready', () => {
    log.info('Client logged in');

    if (!isInitialized) {
        Helper.setClient(Client);

        DB.initialize(Client);

        isInitialized = true;
    }
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled rejection at:', promise, 'reason:', reason);
});

Client.on('error', err => log.error(err));
Client.on('warn', err => log.warn(err));
Client.on('debug', err => log.debug(err));

Client.on('rateLimit', event =>
    log.warn(`Rate limited for ${event.timeout} ms, triggered by method '${event.method}', path '${event.path}', route '${event.route}'`));

Client.on('commandRun', (command, result, message, args, fromPattern) => {
    log.debug(`Command '${command.name}' run from message '${message.content}' by user ${message.author.id}`);
    message.isSuccessful = true;
});

Client.on('commandError', (command, err, message, args, fromPattern) => {
    log.error(`Command '${command.name}' error from message '${message.content}' by user ${message.author.id}`);
});

Client.on('disconnect', event => {
    log.error(`Client disconnected, code ${event.code}, reason '${event.reason}'...`);

    Client.destroy()
        .then(() => Client.login(privateSettings.discordBotToken))
        .catch(err => log.error(err));
});

Client.on('reconnecting', () => log.info('Client reconnecting...'));

Client.on('guildUnavailable', guild => {
    log.warn(`Guild ${guild.id} unavailable!`);
});

Client.login(privateSettings.discordBotToken);
