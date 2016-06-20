'use strict';

import {EventEmitter} from 'events';
import JassAppDispatcher from '../jassAppDispatcher';
import JassAppConstants from '../jassAppConstants';
import * as Card from '../../../shared/deck/card';

export const GameState = {
    WAITING: 'WAITING',
    SESSION_STARTED: 'SESSION_STARTED',
    REQUESTING_TRUMPF: 'REQUESTING_TRUMPF',
    TRUMPF_CHOSEN: 'TRUMPF_CHOSEN',
    REQUESTING_CARD: 'REQUESTING_CARD',
    REJECTED_CARD: 'REJECTED_CARD',
    REQUESTING_CARDS_FROM_OTHER_PLAYERS: 'REQUESTING_CARDS_FROM_OTHER_PLAYERS',
    STICH: 'STICH'
};

export const CardType = {
    FRENCH: 'french',
    GERMAN: 'german'
};

export const PlayerType = {
    PLAYER: 'PLAYER',
    SPECTATOR: 'SPECTATOR'
};

let player,
    spectatorEventQueue = [],
    spectatorRenderingIntervall = 500;

let GameStore = Object.assign(Object.create(EventEmitter.prototype), {
    state: {
        playerType: PlayerType.PLAYER,
        cardType: CardType.FRENCH,
        players: [],
        teams: [],
        playerSeating: ['bottom', 'right', 'top', 'left'],
        tableCards: [],
        playerCards: [],
        startingPlayerIndex: 0,
        nextStartingPlayerIndex: 0,
        roundPlayerIndex: 0,
        cyclesMade: 0,
        status: GameState.WAITING
    },

    addChangeListener: function (callback) {
        this.on('change', callback);
    },

    removeChangeListener: function (callback) {
        this.removeListener('change', callback);
    },

    spectatorRendering() {
        var payload = spectatorEventQueue.shift();
        if (payload) {
            this.handlePayload(payload);
            if(payload.action.actionType === JassAppConstants.BROADCAST_GAME_FINISHED){
                return;
            }
        }
        setTimeout(this.spectatorRendering.bind(this), spectatorRenderingIntervall);
    },
    handleAction(payload) {
        if (payload.source === JassAppDispatcher.Source.SERVER_ACTION && this.state.playerType === PlayerType.SPECTATOR) {
            spectatorEventQueue.push(payload);
        } else {
            this.handlePayload(payload);
        }
    },
    handlePayload(payload) {
        let action = payload.action;
        switch (action.actionType) {
            case JassAppConstants.CHOOSE_EXISTING_SESSION_SPECTATOR:
                this.state.playerType = PlayerType.SPECTATOR;
                this.spectatorRendering();
                this.emit('change');
                break;
            case JassAppConstants.ADJUST_SPECTATOR_SPEED:
                spectatorRenderingIntervall = action.data;
                break;
            case JassAppConstants.SESSION_JOINED:
                let playerSeating = this.state.playerSeating,
                    playerIndex;

                if (!player) {
                    player = action.data.player;
                    this.state.players = action.data.playersInSession;

                    playerIndex = this.state.players.findIndex((element) => {
                        return element.id === player.id;
                    });
                } else {
                    this.state.players.push(action.data.player);
                }

                this.state.playerSeating = playerSeating.concat(playerSeating.splice(0, 4 - playerIndex));
                this.emit('change');
                break;
            case JassAppConstants.BROADCAST_TEAMS:
                this.state.status = GameState.SESSION_STARTED;
                this.state.teams = action.data;
                this.emit('change');
                break;
            case JassAppConstants.DEAL_CARDS:
                this.state.playerCards = action.data.map((card) => Card.create(card.number, card.color));
                this.emit('change');
                break;
            case JassAppConstants.REQUEST_TRUMPF:
                this.state.status = GameState.REQUESTING_TRUMPF;
                this.state.isGeschoben = action.data;
                this.emit('change');
                break;
            case JassAppConstants.CHOOSE_TRUMPF:
                this.state.status = GameState.TRUMPF_CHOSEN;
                this.state.tableCards = [];
                this.emit('change');
                break;
            case JassAppConstants.BROADCAST_TRUMPF:
                this.state.status = GameState.TRUMPF_CHOSEN;
                this.state.mode = action.data.mode;
                this.state.color = action.data.trumpfColor;
                this.emit('change');
                break;
            case JassAppConstants.CHANGE_CARD_TYPE:
                this.state.cardType = action.data;
                this.emit('change');
                break;
            case JassAppConstants.REQUEST_CARD:
                this.state.status = GameState.REQUESTING_CARD;
                this.emit('change');
                break;
            case JassAppConstants.CHOOSE_CARD:
                let chosenCard = action.data;
                this.state.playerCards = this.state.playerCards.filter((card) => {
                    return chosenCard.color !== card.color || chosenCard.number !== card.number;
                });
                this.emit('change');
                break;
            case JassAppConstants.REJECT_CARD:
                let rejectedCard = Card.create(action.data.number, action.data.color);
                this.state.status = GameState.REJECTED_CARD;
                this.state.playerCards.push(rejectedCard);
                this.emit('change');
                break;
            case JassAppConstants.PLAYED_CARDS:
                this.state.startingPlayerIndex = this.state.nextStartingPlayerIndex;
                this.state.status = GameState.REQUESTING_CARDS_FROM_OTHER_PLAYERS;
                this.state.tableCards = action.data;
                this.emit('change');
                break;
            case JassAppConstants.BROADCAST_STICH:
                let playerId = action.data.id,
                    teams = action.data.teams;
                this.state.status = GameState.STICH;
                this.state.cyclesMade++;

                if (this.state.cyclesMade === 9) {
                    this.state.cyclesMade = 0;
                    this.state.roundPlayerIndex = ++this.state.roundPlayerIndex % 4;
                    this.state.nextStartingPlayerIndex = this.state.roundPlayerIndex;
                } else {
                    this.state.players.every((player, index) => {
                        if (player.id === playerId) {
                            this.state.nextStartingPlayerIndex = index;
                            return false;
                        }

                        return true;
                    });
                }

                teams.forEach((team) => {
                    this.state.teams.forEach((stateTeam) => {
                        if (stateTeam.name === team.name) {
                            stateTeam.points = team.points;
                            stateTeam.currentRoundPoints = team.currentRoundPoints;
                        }
                    });
                });
                this.emit('change');
                break;
        }
    }

});

JassAppDispatcher.register(GameStore.handleAction.bind(GameStore));

export default GameStore;
