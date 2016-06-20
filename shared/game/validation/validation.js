'use strict';

import HandCardValidator from './hasCardValidator.js';
import AngebenValidator from './angebenValidator.js';
import UnderTrumpfValidator from './underTrumpfValidator.js';

const Validation = {
    validate (tableCards, handCards, cardToPlay) {
        let success = true;
        if (tableCards.length === 4) {
            return success;
        }
        this.validationParameters.tableCards = tableCards;
        this.validationParameters.handCards = handCards;
        this.validationParameters.cardToPlay = cardToPlay;

        for (let i = 0; i < this.validators.length; i++) {
            let validity = this.validators[i].validate(this.validationParameters);
            if (!validity.permitted) {
                return false;
            }
        }
        return success;
    }
};


export default {
    create (gameMode, trumpColor) {
        let validation = Object.create(Validation);
        validation.validators = [];
        validation.errors = [];
        validation.validationParameters = {
            mode: gameMode,
            color: trumpColor
        };

        validation.validators.push(HandCardValidator);
        validation.validators.push(AngebenValidator);
        validation.validators.push(UnderTrumpfValidator);
        return validation;
    }
};