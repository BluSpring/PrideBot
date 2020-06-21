const {EventListener} = require('events');
const WebSocket = require('ws');
const Logger = require('log4js');
const {Client} = require('discord.js');

module.exports = class PrideMusic extends EventListener {
    /**
     * 
     * @param {String} address 
     * @param {Number} port 
     * @param {Logger} logger 
     * @param {Client} client
     */
    constructor (address, port, logger, client) {
        this.address = address;
        this.port = port;
        this.logger = logger.getLogger('PrideMusic');
        this.client = client;
        this.ws = new WebSocket(`ws://${address}${port == 0 ? `` : `:${port}`}`);

        this.ws.on('open', () => {
            this.logger.info(`Connected to PrideMusic server at ${address}:${port}!`);
            this.send({
                op: 0,
                d: {
                    client_id: this.client.user.id,
                    authorization: this.client.config.music.password
                }
            });
        });
    }

    /**
     * 
     * @param {Object} data 
     */
    send(data) {
        this.ws.send(JSON.stringify(data));
    }
}