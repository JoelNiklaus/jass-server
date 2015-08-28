'use strict';

import glicko2 from 'glicko2';
import {polyfill} from 'babel';

let ranking = new glicko2.Glicko2({
    // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
    // be tested to decide which value results in greatest predictive accuracy."
    tau: 0.5,
    // rating : default rating
    rating: 1500,
    //rd : Default rating deviation
    //     small number = good confidence on the rating accuracy
    rd: 200,
    //vol : Default volatility (expected fluctation on the player rating)
    vol: 0.06
});

let players = [];
let matches = [];

function getPlayer(playerName) {
    return players.find((player) => {
        return player.name === playerName;
    });
}

let Ranking = {
    addPlayer: (playerName) => {
        players.push({
            name: playerName,
            player: ranking.makePlayer()
        });
    },

    updateMatchResult: ({winner, loser}) => {
        matches.push([
            getPlayer(winner),
            getPlayer(loser),
            1
        ]);
    },

    updateRatings: () => {
        ranking.updateRatings(matches);
        matches = [];
    }
};

module.exports = Ranking;