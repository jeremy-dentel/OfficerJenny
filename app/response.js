"use strict";

const log = require('loglevel').getLogger('Word'),
    Helper = require('./helper'),
    DB = require('./db');

class Response {
    addResponse(response) {
        return DB.insertIfAbsent('Responses', Object.assign({},
            {
                response: response
            }));
    }

    removeResponse(id) {
        return DB.DB('Responses')
            .where('id', id)
            .delete();
    }

    async getResponses() {
        const results = await DB.DB('Responses');
        return results || [];
    }

    async getRandomResponse() {
        const results = await DB.DB('Responses');
        const responseNumber = Math.floor(Math.random() * (results.length + 1))

        return results[responseNumber] || results[0];
    }

    async sendResponse(message, user) {
        let responseInfo = await this.getRandomResponse();
        // console.log(response);
        let responseMessage = responseInfo.response.replace('$user', user.toString());

        message.channel.send(responseMessage)
            .then(jennyMessage => {
                setTimeout(() => {
                    jennyMessage.delete();
                }, 15000);
            });
    }
}

module.exports = new Response();
