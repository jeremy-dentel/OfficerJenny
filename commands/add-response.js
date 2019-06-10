"use strict";

const log = require('loglevel').getLogger('ResponseCommand'),
    Commando = require('discord.js-commando'),
    Helper = require('../app/helper'),
    Response = require('../app/response');

class ResponseCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'add-response',
            group: 'moderation',
            memberName: 'add-response',
            description: `Adds a response to the filter system, use $user to signify tag.`,
            details: 'Use this command to add a response.',
            examples: ['\t!add-response That is not a nice word, $user.'],
            args: [
                {
                    key: 'response',
                    label: 'response',
                    prompt: 'What response would you like to add? User `$user` to signify the user tag.\n',
                    type: 'string'
                }
            ],
            argsPromptLimit: 3,
            guildOnly: true
        });

        client.dispatcher.addInhibitor(message => {
            if (!!message.command && message.command.name === 'add-response' && !Helper.isBotChannel(message)) {
                return ['invalid-channel', message.reply('Invalid Channel')];
            }
            return false;
        });
    }

    async run(message, args) {
        const text = args['response'];

        Response.addResponse(text)
            .then(result => message.react('👍'))
            .catch(err => log.error(err));
    }
}

module.exports = ResponseCommand;
