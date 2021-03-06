import * as ClientApi from '../communication/clientApi';
import * as SessionFactory from './sessionFactory';
import {SessionChoice} from '../../shared/session/sessionChoice';
import {SessionType} from '../../shared/session/sessionType';
import nameGenerator from 'docker-namesgenerator';
import {MessageType} from '../../shared/messages/messageType';
import Registry from '../registry/registry';
import {Logger} from '../logger';

let clientApi = ClientApi.create();

let messageListeners = [];

function findOrCreateSessionWithSpace(sessions, sessionChoiceResponse) {
	let filteredSessions = sessions.filter((session) => {
		return !session.started;
	});

	if (filteredSessions.length === 0) {
		return createSession(sessions, {
			sessionName: sessionChoiceResponse.sessionName || nameGenerator(),
			sessionType: sessionChoiceResponse.sessionType || SessionType.SINGLE_GAME
		});
	}

	return filteredSessions[0];
}

function createSession(sessions, sessionChoiceResponse) {
	let session = SessionFactory.create(sessionChoiceResponse.sessionName, sessionChoiceResponse.sessionType);
	sessions.push(session);
	return session;
}

function findSession(sessions, sessionChoiceResponse) {
	let filteredSessions = sessions.filter((session) => {
		return session.name === sessionChoiceResponse.sessionName;
	});

	if (filteredSessions.length === 0) {
		return createSession(sessions, sessionChoiceResponse);
	}

	return filteredSessions[0];
}

function createAndReturnSession(sessions, sessionChoiceResponse) {
	switch (sessionChoiceResponse.sessionChoice) {
		case SessionChoice.CREATE_NEW:
			return createSession(sessions, sessionChoiceResponse);
		case SessionChoice.SPECTATOR:
		case SessionChoice.JOIN_EXISTING:
			return findSession(sessions, sessionChoiceResponse);
		default:
			return findOrCreateSessionWithSpace(sessions, sessionChoiceResponse);
	}
}

function keepSessionAlive(webSocket, interval) {
	if (webSocket.readyState === 1) {
		webSocket.ping();
		setTimeout(keepSessionAlive.bind(null, webSocket, interval), interval);
	}
}

function handleTournamentStart(SessionHandler, webSocket, session) {
	if (!session.started && session.isComplete()) {
		SessionHandler.startSession(session);
	} else {
		clientApi.waitForTournamentStart(webSocket).then(handleTournamentStart);
	}
}


const SessionHandler = {

	sessions: [],

	getAvailableSessionNames() {
		return this.sessions.filter((session) => {
			return !session.started;
		}).map((session) => {
			return session.name;
		});
	},

	/**
	 * Gets all the sessions and picks only the name and started boolean to return because of security considerations
	 * (we do not want to send the entire session to the client).
	 * @returns {any[]}
	 */
	getAllSessionNamesWithStartedBoolean() {
		// https://www.jstips.co/en/javascript/picking-and-rejecting-object-properties/
		function pick(obj, keys) {
			return keys.map(k => k in obj ? {[k]: obj[k]} : {}).reduce((res, o) => Object.assign(res, o), {});
		}

		return this.sessions.map((session) => {
			return pick(session, ['name', 'started', 'type']);
		});
	},

	handleClientConnection(ws) {
		keepSessionAlive(ws, 10000);

		messageListeners.push(clientApi.subscribeMessage(ws, MessageType.REQUEST_REGISTRY_BOTS, () => {
			Registry.getRegisteredBots()
				.then(bots => clientApi.sendRegistryBots(ws, bots))
				.catch(error => Logger.debug(`Can't reach Jassbot registry, got ${error}`));
		}));

		messageListeners.push(clientApi.subscribeMessage(ws, MessageType.ADD_BOT_FROM_REGISTRY, (message) => {
			const bot = message.data.bot;
			const sessionName = message.data.sessionName;
			Registry.addBot(bot, SessionType.TOURNAMENT, sessionName);
		}));

		return clientApi.requestPlayerName(ws).then((playerName) => {
			return clientApi.requestSessionChoice(ws, this.getAllSessionNamesWithStartedBoolean()).then((sessionChoiceResponse) => {
				const session = createAndReturnSession(this.sessions, sessionChoiceResponse);
				let advisedPlayerName = sessionChoiceResponse.advisedPlayerName;

				if (sessionChoiceResponse.sessionChoice === SessionChoice.SPECTATOR || sessionChoiceResponse.asSpectator) {
					session.addSpectator(ws);

					if (session.type === SessionType.TOURNAMENT) {
						clientApi.waitForTournamentStart(ws).then(handleTournamentStart.bind(null, this, ws, session));
					}
				} else if (sessionChoiceResponse.sessionChoice === SessionChoice.ADVISOR) {
					session.addAdvisor(ws, advisedPlayerName)
				} else {
					session.addPlayer(ws, playerName, sessionChoiceResponse.chosenTeamIndex, sessionChoiceResponse.isHuman);
					if (session.type === SessionType.SINGLE_GAME && session.isComplete()) {
						this.startSession(session);
					}
				}
			});
		});
	},

	startSession(session) {
		messageListeners = messageListeners.filter(unbindListener => {
			unbindListener();
			return false;
		});

		session.start().then(
			this.finishSession.bind(this, session),
			this.finishSession.bind(this, session));
	},

	finishSession(session) {
		session.close('Game Finished');
		this.removeSession(session);
	},

	removeSession(session) {
		let index = this.sessions.indexOf(session);
		this.sessions.splice(index, 1);
	},

	resetInstance() {
		this.sessions = [];
	}

};

export default SessionHandler;
