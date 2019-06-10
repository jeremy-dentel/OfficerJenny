"use strict";

const log = require('loglevel').getLogger('Helper'),
    words = require('./word'),
    settings = require('../data/settings'),
    Response = require('./response'),
    {MessageEmbed} = require('discord.js');

class Helper {
    constructor() {
        this.client = null;

        // cache of emoji ids, populated on client login
        this.emojis = null;

        this.filteredWords = this.setFilteredWords();
    }

    async setFilteredWords() {
        this.filteredWords = await words.getFilteredWords();
    }

    setClient(client) {
        this.client = client;

        this.emojis = new Map(this.client.emojis.map(emoji => [emoji.name.toLowerCase(), emoji]));

        // map out some shortcuts per connected guild, so that a lengthy "find" is not required constantly
        // TODO:  Some day instead of using a single configurable settings channel name, allow each guild to set a bot channel in DB
        this.guild = new Map(this.client.guilds.map(guild => {
            const roles = new Map(guild.roles.map(role => [role.name.toLowerCase(), role]));

            return [
                guild.id,
                {
                    channels: {
                        botLab: guild.channels.find(channel => {
                            return channel.name === settings.channels["bot-lab"];
                        }),
                        modBotLab: guild.channels.find(channel => {
                            return channel.name === settings.channels["mod-bot-lab"];
                        }),
                        reportsChannel: guild.channels.find(channel => {
                            return channel.name === settings.channels.reports;
                        })
                    },
                    roles,
                    emojis: null
                }
            ]
        }));

        this.client.on('message', message => {
            if (message.type === 'PINS_ADD' && message.client.user.bot) {
                message.delete()
                    .catch(err => log.error(err));
            }

            if (message.channel.type !== 'dm') {
                const reportChannel = this.guild.get(message.guild.id).channels.reportsChannel;
                let requiresFilter = false;

                this.filteredWords.forEach(word => {
                    let messageWords = message.content.toLowerCase().split(/\s/);

                    messageWords.forEach(messageWord => {
                        if (messageWord.indexOf(word) !== -1) {
                            if (word.length === messageWord.length || word.length / messageWord.length >= .8) {
                                requiresFilter = true;
                            }
                        }
                    });
                });

                if (requiresFilter) {
                    let embed = new MessageEmbed();

                    Response.sendResponse(message, message.author);
                    embed.setThumbnail(message.author.avatarURL());
                    embed.addField('User', message.author.toString());
                    embed.addField('Message', message.content);
                    embed.addField('Channel', message.channel.toString());
                    embed.addField('Date and Time', (new Date(message.createdTimestamp)).toString());

                    message.delete();

                    reportChannel.send('New Message Filter Report', embed);
                }
            }
        });

        this.client.on('raw', async event => {
            if (event.t === 'MESSAGE_REACTION_ADD') {
                const { d: data } = event;
                const user = this.client.users.get(data.user_id);
                const channel = this.client.channels.get(data.channel_id) || await user.createDM();

                if (channel.messages.has(data.message_id)) return;

                const message = await channel.messages.fetch(data.message_id);
                const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
                const reaction = message.reactions.get(emojiKey);

                client.emit('messageReactionAdd', reaction, user);
            }
        });

        this.client.on('messageReactionAdd', (reaction, user) => {
            const reportChannel = this.guild.get(reaction.message.guild.id).channels.reportsChannel;
            let requiresFilter = false;
            this.filteredWords.forEach(word => {
                if (reaction.emoji.name === word) {
                    requiresFilter = true;
                }
            });

            if (requiresFilter) {
                let embed = new MessageEmbed();

                // Respones.sendResponse(reaction.message, user);
                reaction.users.remove(user.id);
                embed.setThumbnail(user.avatarURL());
                embed.addField('User', user.toString());
                embed.addField('Reaction', reaction.emoji.name);
                embed.addField('Channel', reaction.message.channel.toString());
                embed.addField('Date and Time', (new Date()).toString());

                reportChannel.send('New Reaction Filter Report', embed);
            }
        });

        this.client.on('guildCreate', guild => {
            console.log(guild);
            // cache this guild's roles
            this.guild.set(guild, [
                guild.id,
                {
                    channels: {
                        botLab: guild.channels.find(channel => {
                            return channel.name === settings.channels["bot-lab"];
                        }),
                        modBotLab: guild.channels.find(channel => {
                            return channel.name === settings.channels["mod-bot-lab"];
                        }),
                        reportsChannel: guild.channels.find(channel => {
                            log.error(channel.name);
                            return channel.name === settings.channels["reports"];
                        })
                    },
                    roles: new Map(guild.roles.map(role => [role.name.toLowerCase(), role])),
                    emojis: null
                }
            ]);
        });

        this.client.on('guildDelete', guild => {
            // remove this guild from cache
            this.guild.delete(guild.id);
        });

        this.client.on('roleCreate', role => {
            // add new role to corresponding cache entry for its guild
            const guildMap = this.guild.get(role.guild.id).roles;

            if (!!guildMap) {
                guildMap.set(role.name.toLowerCase(), role);
            }
        });

        this.client.on('roleDelete', role => {
            // remove role from corresponding cache entry for its guild
            const guildMap = this.guild.get(role.guild.id).roles;

            if (!!guildMap) {
                guildMap.delete(role.name.toLowerCase());
            }
        });

        this.client.on('roleUpdate', (oldRole, newRole) => {
            // remove old role from corresponding cache entry for its guild and
            // add new role to corresponding cache entry for its guild

            // these *should* be the same guild but let's not assume that!
            const oldGuildMap = this.guild.get(oldRole.guild.id).roles,
                newGuildMap = this.guild.get(newRole.guild.id).roles;

            if (!!oldGuildMap) {
                oldGuildMap.delete(oldRole.name.toLowerCase());
            }

            if (!!newGuildMap) {
                newGuildMap.set(newRole.name.toLowerCase(), newRole);
            }
        });

        client.on('emojiCreate', emoji => {
            // add new emoji to emojis cache
            this.emojis.set(emoji.name.toLowerCase(), emoji);
        });

        client.on('emojiDelete', emoji => {
            // delete emoji from emojis cache
            this.emojis.delete(emoji.name.toLowerCase());
        });

        client.on('emojiUpdate', (oldEmoji, newEmoji) => {
            // delete old emoji from emojis cache and add new one to it
            this.emojis.delete(oldEmoji.name.toLowerCase());
            this.emojis.set(newEmoji.name.toLowerCase(), newEmoji);
        });
    }

    isManagement(message) {
        let isModOrAdmin = false;

        if (message.channel.type !== 'dm') {
            const adminRole = this.getRole(message.guild, 'admin'),
                moderatorRole = this.getRole(message.guild, 'moderator'),

                adminRoleId = adminRole ?
                    adminRole.id :
                    -1,
                moderatorRoleId = moderatorRole ?
                    moderatorRole.id :
                    -1;

            isModOrAdmin = message.member.roles.has(adminRoleId) ||
                message.member.roles.has(moderatorRoleId);
        }
        return isModOrAdmin || this.client.isOwner(message.author);
    }

    isBotChannel(message) {
        if (message.channel.type === 'dm') {
            return false;
        }

        const guild = this.guild.get(message.guild.id),
            botLabChannelId = guild.channels.botLab ?
                guild.channels.botLab.id :
                -1,
            modBotLabChannelId = guild.channels.modBotLab ?
                guild.channels.modBotLab.id :
                -1;

        return message.channel.id === botLabChannelId || message.channel.id === modBotLabChannelId;
    }

    getRole(guild, roleName) {
        const guildMap = this.guild.get(guild.id);

        return guildMap.roles.get(roleName.toLowerCase());
    }

    getBotChannel(channel) {
        const guild = this.guild.get(channel.guild.id);
        return guild.channels.botLab;
    }

    getEmoji(emojiName) {
        return this.emojis.has(emojiName.toLowerCase()) ?
            this.emojis.get(emojiName.toLowerCase()) :
            '';
    }
}

module.exports = new Helper();
