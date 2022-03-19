import React from 'react';
import { IGameArgs } from 'gamesShared/definitions/game';
import { GameLayout } from 'gamesShared/components/fbg/GameLayout';
import { Grid, Token } from 'deprecated-bgio-ui';
import { getPlayer, getValidPositions, inBounds, getAllPositions } from './game';
import { Ctx } from 'boardgame.io';
import { withCurrentGameTranslation, WithCurrentGameTranslation } from 'infra/i18n';
import { compose } from 'recompose';
import { Scoreboard, IScore } from 'gamesShared/components/scores/Scoreboard';
import { IOptionsItems } from 'gamesShared/components/fbg/GameDarkSublayout';

import red from '@material-ui/core/colors/red';
import yellow from '@material-ui/core/colors/yellow';
import green from '@material-ui/core/colors/lightGreen';
import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';

import Typography from '@material-ui/core/Typography';

import Controls from './Controls';

import { pieces } from './pieces';
import { isLocalGame } from '../../gamesShared/helpers/gameMode';
import { IG, IPiece, IColorMap, IPieceTransform } from './types';

interface IBoardInnerProps extends WithCurrentGameTranslation {}

interface IBoardProps {
  G: IG;
  ctx: Ctx;
  moves: any;
  playerID: string;
  gameArgs?: IGameArgs;
}

interface IBoardState {
  piece: IPiece;
  validTransform: boolean;
}

export class BoardInternal extends React.Component<IBoardProps & IBoardInnerProps, IBoardState> {
  constructor(props: IBoardProps & IBoardInnerProps) {
    super(props);
    this.state = {
      piece: {
        transform: { x: 10, y: 10, rotation: 0, flipX: false, flipY: false },
        index: 0,
        data: pieces[0],
      },
      validTransform: false,
    };
  }

  _endGame = this.endGame.bind(this);
  _modifyPiece = this.modifyPiece.bind(this);
  _placePiece = this.placePiece.bind(this);

  endGame() {
    this.props.moves.endGame();
  }

  modifyPiece(piece: IPiece) {
    this.setState({ ...this.state, piece, validTransform: this.isTransformValid(piece.data, piece.transform) });
  }

  placePiece() {
    this.props.moves.placePiece(this.state.piece.index, this.state.piece.transform);
  }

  _getGameOver() {
    const scoreboard: IScore[] = this.props.ctx.gameover.scoreboard;
    if (scoreboard[0].score === scoreboard[scoreboard.length - 1].score) {
      return this.props.translate('board.game_over.draw');
    } else {
      if (isLocalGame(this.props.gameArgs)) {
        const playerName = scoreboard[0].score > scoreboard[1].score ? 'board.blue_yellow' : 'board.red_green';
        return this.props.translate('board.game_over.player_won', { playerName: this.props.translate(playerName) });
      } else {
        if (scoreboard[0].score === scoreboard.find((rank) => rank.playerID === this.props.playerID).score) {
          return this.props.translate('board.game_over.you_won');
        } else {
          return this.props.translate('board.game_over.you_lost');
        }
      }
    }
  }

  _getScoreBoard() {
    return (
      <Scoreboard
        scoreboard={this.props.ctx.gameover.scoreboard}
        playerID={this.props.playerID}
        players={this.props.gameArgs.players}
      />
    );
  }

  isTransformValid(data: boolean[], transform: IPieceTransform) {
    return (
      getValidPositions(
        this.props.G,
        this.props.ctx,
        data,
        transform,
        getPlayer(this.props.ctx, this.props.G, this.props.ctx.currentPlayer),
      ) !== null
    );
  }

  _getStatus() {
    if (!this.props.gameArgs) {
      return;
    }

    let message = '';
    if (this.props.gameArgs) {
      let player;
      if (this.props.ctx.numPlayers !== 2) {
        switch (this.props.ctx.currentPlayer) {
          case '0': {
            player = this.props.translate('board.blue');
            break;
          }
          case '1': {
            player = this.props.translate('board.yellow');
            break;
          }
          case '2': {
            player = this.props.translate('board.red');
            break;
          }
          case '3': {
            player = this.props.translate('board.green');
            break;
          }
        }
      } else {
        switch (this.props.ctx.currentPlayer) {
          case '0': {
            player = this.props.translate('board.blue_yellow');
            break;
          }
          case '1': {
            player = this.props.translate('board.red_green');
            break;
          }
        }
      }

      message = this.props.translate('board.player_turn', { playerName: player });
    } else if (this.props.ctx.currentPlayer === this.props.playerID && !isLocalGame(this.props.gameArgs)) {
      message = this.props.translate('board.place_piece');
    } else if (this.props.ctx.currentPlayer !== this.props.playerID && !isLocalGame(this.props.gameArgs)) {
      message = this.props.translate('board.waiting_for_oponent');
    }
    return message;
  }

  _onDrop = (coords: { x: number; y: number; originalX: number; originalY: number }) => {
    const x = Math.round(coords.x);
    const y = Math.round(coords.y);
    const transform = { ...this.state.piece.transform, x, y };
    const positions = getAllPositions(this.state.piece.data, transform);
    if (positions.every((pos) => inBounds(pos.x, pos.y))) {
      this.setState({
        ...this.state,
        piece: { ...this.state.piece, transform },
        validTransform: this.isTransformValid(this.state.piece.data, transform),
      });
    }
  };

  _getOptionsMenuItems = () => {
    const option: IOptionsItems = {
      onClick: this._endGame,
      text: this.props.translate('board.end_game'),
    };
    const options = [option];
    return options;
  };

  componentDidUpdate(prevProps: IBoardProps) {
    if (prevProps.ctx.turn !== this.props.ctx.turn) {
      const transform = { ...this.state.piece.transform, flipX: false, flipY: false, rotation: 0, x: 10, y: 10 };
      const data =
        pieces[
          this.props.G.players[getPlayer(this.props.ctx, this.props.G, this.props.ctx.currentPlayer) as any].pieces[0]
        ];
      this.setState({
        ...this.state,
        piece: {
          ...this.state.piece,
          index: 0,
          transform,
          data,
        },
        validTransform: this.isTransformValid(data, transform),
      });
    }
  }

  render() {
    if (this.props.ctx.gameover) {
      return (
        <GameLayout
          gameOver={this._getGameOver()}
          extraCardContent={this._getScoreBoard()}
          gameArgs={this.props.gameArgs}
        />
      );
    }

    const colors = [blue, yellow, red, green];
    const colorMap = this.getColorMap(colors);

    return (
      <div>
        <GameLayout optionsMenuItems={this._getOptionsMenuItems} gameArgs={this.props.gameArgs}>
          <Typography variant="h5" style={{ textAlign: 'center', color: 'white', marginBottom: '16px' }}>
            {this._getStatus()}
          </Typography>
          <Grid rows={20} cols={20} onClick={() => null} colorMap={colorMap}>
            {isLocalGame(this.props.gameArgs) || this.props.ctx.currentPlayer === this.props.playerID ? (
              <Token
                x={this.state.piece.transform.x}
                y={this.state.piece.transform.y}
                draggable={true}
                shouldDrag={() => true}
                onDrop={this._onDrop}
              >
                <g>
                  <g
                    fill={colors[getPlayer(this.props.ctx, this.props.G, this.props.ctx.currentPlayer) as any][600]}
                    opacity={0.9}
                  >
                    {this.state.piece.data
                      .map((square, index) => ({ square, index }))
                      .filter((piece) => piece.square)
                      .map((piece) => (
                        <rect
                          x={piece.index % Math.sqrt(this.state.piece.data.length)}
                          y={Math.floor(piece.index / Math.sqrt(this.state.piece.data.length))}
                          width="1"
                          height="1"
                          key={piece.index}
                        ></rect>
                      ))}
                  </g>
                  <rect width="50" height="50" x="-25" y="-25" fill="none" style={{ pointerEvents: 'all' }}></rect>
                </g>
              </Token>
            ) : (
              <div></div>
            )}
          </Grid>
          <Controls
            placePiece={this._placePiece}
            modifyPiece={this._modifyPiece}
            validTransform={this.state.validTransform}
            piece={this.state.piece}
            G={this.props.G}
            ctx={this.props.ctx}
          />
        </GameLayout>
      </div>
    );
  }

  getColorMap(colors: any[]): IColorMap {
    const colorMap = {} as IColorMap;

    this.props.G.board
      .map((square, index) => ({ square, index }))
      .forEach((piece) => {
        const x = piece.index % 20;
        const y = Math.floor(piece.index / 20);

        const key = `${x},${y}`;
        let color: any = grey[800];
        if (piece.square !== null) {
          if ((x + y) % 2 === 0) {
            color = colors[piece.square as any][700];
          } else {
            color = colors[piece.square as any][600];
          }
        } else if (x === 0 && y === 0) {
          color = blue[400];
        } else if (x === 19 && y === 0) {
          color = yellow[400];
        } else if (x === 19 && y === 19) {
          color = red[400];
        } else if (x === 0 && y === 19) {
          color = green[400];
        } else if ((x + y) % 2 === 0) {
          color = grey[900];
        }
        colorMap[key] = color;
      });

    return colorMap;
  }
}

const enhance = compose<IBoardProps, IBoardInnerProps>(withCurrentGameTranslation);
export const Board = enhance(BoardInternal);
