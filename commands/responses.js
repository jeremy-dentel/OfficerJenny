"use strict";

const log = require('loglevel').getLogger('ResponsesCommand'),
    Commando = require('discord.js-commando'),
    Response = require('../app/response'),
    {MessageEmbed} = require('discord.js'),
    Helper = require('../app/helper');

class ResponsesCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'response-list',
            group: 'moderation',
            memberName: 'response-list',
            description: 'Lists registered responses.',
            examples: ['\t!response-list'],
            guildOnly: true
        });

        client.dispatcher.addInhibitor(message => {
            if (!!message.command && message.command.name === 'response-list' && !Helper.isBotChannel(message)) {
                return ['invalid-channel', message.reply('You are not authorized to use this command.')];
            }
            return false;
        });
    }

    async run(message, args) {
        const responses = await Response.getResponses(),
            embed = new MessageEmbed();

        let responseResults = '';
        responses.forEach(resp => {
            if (responseResults) {
                responseResults += '\n';
            }

            responseResults += `${resp.id}: ${resp.response}`;
        });

        embed.addField('**Responses (ID: Response)**', responseResults || 'No Responses Added');

        message.channel.send('', {embed})
            .then(result => {
                message.react('👍');
            }).catch(err => log.error(err));
    }
}

module.exports = ResponsesCommand;
