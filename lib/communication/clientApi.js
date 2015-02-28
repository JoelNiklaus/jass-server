'use strict';

function toJSON(object) {
    return JSON.stringify(object);
}

function fromJSON(string) {
    try {
        return JSON.parse(string);
    } catch (error) {
        console.error("Bad message from client");
    }
}

function handleMessages(message) {
    // TODO match various api messages
}

var ClientApi = {

    setClients : function setClients(clients) {
        this.clients = clients;

        clients.forEach(function(client) {
            client.on('message', handleMessages);
        });
    },

    requestTrump : function requestTrump(clientId, pushed) {
        var client = this.clients[clientId];

        client.send(toJSON({
            name: 'requestTrump',
            data: {
                pushed: pushed
            }
        }));

        return new Promise(function(resolve) {
            client.on('message', function handleChooseTrump(message) {
                message = fromJSON(message);

                if (message.name === 'chooseTrump') {
                    client.removeListener('message', handleChooseTrump);
                    resolve(message.data);
                }
            });
        });
    }
};


module.exports = ClientApi;