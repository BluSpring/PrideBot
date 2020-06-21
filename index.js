const Discord = require('discord.js');
const Logger = require('log4js');
const config = require('./config.json');
const date = new Date();
const axios = require('axios');

const logger = Logger.getLogger("Core");
logger.level = 'debug';
const { Manager } = require('@lavacord/discord.js');
const {Player } = require('lavacord');

class Music extends Discord.Client {
    constructor() {
        super();
        /**
         * 
         * @var {Manager} player
         * @type {Manager}
         */
        this.player = null;
        
        this.currentVC = null;
        
        this.currentSong = null;
    }
}
const client = new Music();
client.config = config;

const express = require('express');
const app = express();


app.listen(3000, () => {
    logger.info(`Now listening to port 3000!`);
});


/**
 * @type {Player}
 */
let player = null;

client.on('message', async message => {
    if (!message.content.startsWith(config.prefix)) return;
    if (!!message.author.bot) return;
    const command = message.content.split(/ /g)[0].slice(config.prefix.length).toLowerCase();
    const args = message.content.split(/ /g).slice(1);

    switch (command) {
        case 'help': {
            const embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");
            embed.setTitle('Error!')
                .setDescription("Sorry, there's currently no help available! (wait that came out wrong shoot)");
            message.channel.send(embed);
            break;
        }

        case 'leave': {
            if (!player)
                return message.channel.send(`There's no player!`);

            client.currentVC = null;
            await player.destroy();
            player = null;

            message.channel.send(`Left the voice channel!`);

            break;
        }

        case 'join': {
            if (!message.member.voice.channel)
                return message.channel.send(`You're not in a voice channel!`);
            if (!player) {
                player = await client.player.join({
                    guild: message.guild.id,
                    channel: message.member.voice.channelID,
                    node: client.player.idealNodes[0].id
                });

                if (!player)
                    return message.channel.send(`Failed connecting to your voice channel!`);

                client.currentVC = message.member.voice.channelID;
                message.channel.send(`Connected to voice channel ${message.member.voice.channel.name}.`);
            } else {
                if (client.currentVC == message.member.voice.channelID)
                    return message.channel.send(`I'm already in this voice channel!`);

                player = await client.player.join({
                    guild: message.guild.id,
                    channel: message.member.voice.channelID,
                    node: client.player.idealNodes[0]
                });

                if (!player)
                    return message.channel.send(`Failed switching to your voice channel!`);

                client.currentVC = message.member.voice.channelID;

                message.channel.send(`Switched to voice channel ${message.member.voice.channel.name}.`);
            }
            break;
        }
    }
});

client.on('ready', async () => {
    logger.info(`I'm now ready! (Logged in as ${client.user.tag}/${client.user.id})`);
    client.player = new Manager(client, [
        { 
            "id": "VPS",
            host: config.lavalink.host,
            port: config.lavalink.port,
            "password": config.lavalink.password,
            "region": "eu" 
        }
    ], {
        user: client.user.id,
        shards: (client.shard && client.shard.count) || 1
    });

    client.player.on('ready', (node) => {
        logger.info(`Connected to Lavalink node ${node.host}`); 
    });

    await client.player.connect();

});

app.get('/', (_, res) => {
    res.send('Oh hi!');
});

app.get('/changeSong', async (req, res) => {
    if (!req.query.url)
        return res.status(404).json({status: 404,message: `No URL found for song.`});
    
    if (req.query.password != 'stantwtpride!')
        return res.status(403).json({status: 403, message: `Who are you?`});

    const song = await getSong(req.query.url);

    if (song instanceof Error) {
        logger.error(song.stack);
        return res.status(404).json({status: 404, message: `Song not found.`});
    }
    if (!player)
        return res.status(500).json({status: 500, message: `No player is available! Whoops...`});

    player.play(song[0].track);

    logger.info(`Now playing ${song[0].info.title} by ${song[0].info.author} (track ID ${song[0].track})`);

    res.status(200).json({status: 200, message: `Successfully playing.`});
});

client.login(config.token);

/**
 * 
 * @param {String} string 
 * @returns 
 */
function getSong(string) {
    return new Promise(async(resolve, rej) => {
        try {
            const res = await axios.get(`http://${config.lavalink.address}/loadtracks?identifier=${encodeURIComponent(string)}`, {
                headers: {
                    Authorization: config.lavalink.password
                }
            });
            resolve(res.data.tracks);
        } catch (e) {
            //message.channel.send(`Track not found.`);
            resolve(e); // I know this makes no sense shush
        }
    });
}

/*
;eval ```kotlin
for (entity in ctx.guild.retrieveAuditLogs()) {
  if (entity.type == net.dv8tion.jda.api.audit.ActionType.ROLE_UPDATE) {
    ctx.channel.sendMessage(entity.toString()).queue()
  }
}
```

;eval ```kotlin
for (entity in ctx.guild.retrieveAuditLogs()) {
  if (entity.type == net.dv8tion.jda.api.audit.ActionType.ROLE_UPDATE) {
    if (net.dv8tion.jda.api.utils.TimeUtil.getTimeCreated(entity.idLong).toEpochSecond() >= 1592638275) {
     ctx.channel.sendMessage(entity.getChanges().toString()).queue()
    }
  }
}
```

;eval ```kotlin
for (entity in ctx.guild.retrieveAuditLogs()) {
  if (entity.type == net.dv8tion.jda.api.audit.ActionType.ROLE_UPDATE) {
    if (net.dv8tion.jda.api.utils.TimeUtil.getTimeCreated(entity.idLong).toEpochSecond() >= 1592638275) {
      entity.getChanges().values.forEach {
        val role = entity.guild.roles.find { ab -> ab.idLong == entity.targetIdLong }
        ctx.channel.sendMessage(role.name).queue()
      }
    }
  }
}
```
*/