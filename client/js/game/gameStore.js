'use strict';

let EventEmitter = require('events').EventEmitter,
    JassAppDispatcher = require('../jassAppDispatcher'),
    JassAppConstants = require('../jassAppConstants');

let GameState = {
    WAITING: 'WAITING',
    SESSION_STARTED: 'SESSION_STARTED',
    REQUESTING_TRUMPF: 'REQUESTING_TRUMPF'
};

let player,
    playerIndex;

let GameStore = Object.create(EventEmitter.prototype);

GameStore.GameState = GameState;

GameStore.state = {
    players: [],
    playerSeating: ['bottom', 'left', 'top', 'right'],
    tableCards: [],
    playerCards: [],
    startingPlayerIndex: 0,
    status: GameState.WAITING
};

GameStore.emitChange = function() {
    this.emit('change');
};

GameStore.addChangeListener = function(callback) {
    this.on('change', callback);
};

GameStore.removeChangeListener = function(callback) {
    this.removeListener('change', callback);
};

JassAppDispatcher.register(function (payload){
    let action = payload.action;

    switch(action.actionType) {
        case JassAppConstants.SESSION_JOINED:
            let playerSeating = GameStore.state.playerSeating;

            if (!player) {
                player = action.data.player;
                GameStore.state.players = action.data.playersInSession;

                playerIndex = GameStore.state.players.findIndex((element) => {
                    return element.id === player.id;
                });
            } else {
                GameStore.state.players.push(action.data.player);
            }

            GameStore.state.playerSeating = playerSeating.concat(playerSeating.splice(0, 4 - playerIndex));
            GameStore.emitChange();
            break;
        case JassAppConstants.BROADCAST_TEAMS:
            GameStore.state.status = GameState.SESSION_STARTED;
            //TODO handle teams and player for stats
            GameStore.emitChange();
            break;
        case JassAppConstants.DEAL_CARDS:
            GameStore.state.playerCards = action.data;
            GameStore.emitChange();
            break;
        case JassAppConstants.PLAYED_CARDS:
            GameStore.state.tableCards = action.data;
            GameStore.emitChange();
            break;
        case JassAppConstants.REQUEST_TRUMPF:
            GameStore.state.status = GameState.REQUESTING_TRUMPF;
            GameStore.emitChange();
            break;
    }
});

module.exports = GameStore;