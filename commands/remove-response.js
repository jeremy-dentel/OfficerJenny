"use strict";

const log = require('loglevel').getLogger('RemoveResponseCommand'),
    Commando = require('discord.js-commando'),
    Helper = require('../app/helper'),
    Response = require('../app/response');

class RemoveResponseCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'remove-response',
            group: 'moderation',
            memberName: 'remove-response',
            description: `Removes a response to the filter system, based on the ID.`,
            details: 'Use this command to remove a response.',
            examples: ['\t!add-response That is not a nice word, $user.'],
            args: [
                {
                    key: 'response',
                    label: 'response',
                    prompt: 'Which response would you like to remove?\n',
                    type: 'string'
                }
            ],
            argsPromptLimit: 3,
            guildOnly: true
        });

        client.dispatcher.addInhibitor(message => {
            if (!!message.command && message.command.name === 'remove-response' && !Helper.isBotChannel(message)) {
                return ['invalid-channel', message.reply('Invalid Channel')];
            }
            return false;
        });
    }

    async run(message, args) {
        const text = args['response'];

        Response.removeResponse(text)
            .then(result => message.react('👍'))
            .catch(err => log.error(err));
    }
}

module.exports = RemoveResponseCommand;
