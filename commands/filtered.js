"use strict";

const log = require('loglevel').getLogger('FilteredCommand'),
    Commando = require('discord.js-commando'),
    Word = require('../app/word'),
    {MessageEmbed} = require('discord.js'),
    Helper = require('../app/helper');

class FilteredCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'filtered-list',
            group: 'moderation',
            memberName: 'filtered-list',
            aliases: ['filtered', 'list-filtered'],
            description: 'Lists registered filters.',
            examples: ['\t!filtered'],
            guildOnly: true
        });

        client.dispatcher.addInhibitor(message => {
            if (!!message.command && message.command.name === 'filtered-list' && !Helper.isBotChannel(message)) {
                return ['invalid-channel', message.reply('You are not authorized to use this command.')];
            }
            return false;
        });
    }

    async run(message, args) {
        const words = await Word.getFilteredWords(),
            embed = new MessageEmbed();

        embed.addField('**Filtered Words**', words.join(', '));

        message.channel.send('', {embed})
            .then(result => {
                message.react('👍');
            }).catch(err => log.error(err));
    }
}

module.exports = FilteredCommand;
