"use strict";

const log = require('loglevel').getLogger('DisableFilterCommand'),
    Commando = require('discord.js-commando'),
    Helper = require('../app/helper'),
    Word = require('../app/word');

class DisableFilterCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'disable-filter',
            group: 'moderation',
            memberName: 'disable-filter',
            aliases: ['dfw'],
            description: `Removes a word from the filter system.`,
            details: 'Use this command to disable a word to be filtered.',
            examples: ['\t!disable-filter ass'],
            args: [
                {
                    key: 'word',
                    label: 'word',
                    prompt: 'What word would you like to remove from the filter?\n',
                    type: 'string'
                }
            ],
            argsPromptLimit: 3,
            guildOnly: true
        });

        client.dispatcher.addInhibitor(message => {
            if (!!message.command && message.command.name === 'disable-filter' && !Helper.isBotChannel(message)) {
                return ['invalid-channel', 'Invalid Channel'];
            }
            return false;
        });
    }

    async run(message, args) {
        const word = args['word'];

        Word.disableFilteredWord(word.toLowerCase())
            .then(result => {
                message.react('👍');
                Helper.setFilteredWords();
            })
            .catch(err => log.error(err));
    }
}

module.exports = DisableFilterCommand;
