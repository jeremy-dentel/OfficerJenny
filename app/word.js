"use strict";

const log = require('loglevel').getLogger('Word'),
    Helper = require('./helper'),
    DB = require('./db');

class Word {
    async getFilteredWord(word) {
        const result = await DB.DB('FilteredWords')
            .where('word', word)
            .first();

        return !!result ?
            result :
            null;
    }

    async getFilteredWords() {
        const results = await DB.DB('FilteredWords')
            .where('enabled', true)
            .pluck('word');

        return !!results ?
            results :
            [];
    }

    addFilteredWord(word) {
        return DB.insertIfAbsent('FilteredWords', Object.assign({},
            {
                word: word
            }));
    }

    enableFilteredWord(word) {
        return DB.insertIfAbsent('FilteredWords', Object.assign({},
            {
                word: word
            }))
            .then(wordId => DB.DB('FilteredWords')
                .where('id', wordId)
                .update({
                    enabled: true
                }))
            .catch(err => log.error(err));
    }

    disableFilteredWord(word) {
        return DB.insertIfAbsent('FilteredWords', Object.assign({},
            {
                word: word
            }))
            .then(wordId => DB.DB('FilteredWords')
                .where('id', wordId)
                .update({
                    enabled: false
                }))
            .catch(err => log.error(err));
    }
}

module.exports = new Word();
