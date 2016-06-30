import React from 'react';

export default React.createClass({

    getInitialState() {
        return {
            shown: false
        };
    },

    toggleShown() {
        this.setState({
            shown: !this.state.shown
        });
    },

    render() {
        return (
            <div id="points" className={(this.state.shown) ? 'shown' : ''} onClick={this.toggleShown}>
                {this.props.teams.map((team) => {
                    return (
                        <div key={team.name}>
                            <h3>
                                {team.name} {(() => {
                                    if (this.state.shown) {
                                        return (
                                            <small>({team.players[0].name} & {team.players[1].name})</small>
                                        );
                                    }
                                })()}
                            </h3>
                            <div className="current-round-points">
                                {(this.state.shown) ? 'Current Round: ' : ''}{team.currentRoundPoints}
                            </div>
                            <div className="total-points">
                                {(this.state.shown) ? 'Total: ' : ''}{team.points}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
});
