"use strict";

const log = require('loglevel').getLogger('FilterCommand'),
    Commando = require('discord.js-commando'),
    Helper = require('../app/helper'),
    Word = require('../app/word');

class FilterCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'filter',
            group: 'moderation',
            memberName: 'filter',
            aliases: ['fw'],
            description: `Adds a word to the filter system.`,
            details: 'Use this command to enable a word to be filtered.',
            examples: ['\t!filter ass'],
            args: [
                {
                    key: 'word',
                    label: 'word',
                    prompt: 'What word would you like to filter?\n',
                    type: 'string'
                }
            ],
            argsPromptLimit: 3,
            guildOnly: true
        });

        client.dispatcher.addInhibitor(message => {
            if (!!message.command && message.command.name === 'filter' && !Helper.isBotChannel(message)) {
                return ['invalid-channel', message.reply('Invalid Channel')];
            }
            return false;
        });
    }

    async run(message, args) {
        const word = args['word'];

        Word.addFilteredWord(word.toLowerCase())
            .then(result => {
                message.react('👍');
                Helper.setFilteredWords();
            })
            .catch(err => log.error(err));
    }
}

module.exports = FilterCommand;
