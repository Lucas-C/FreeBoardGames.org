import React, { ChangeEvent } from 'react';
import AlertLayer from 'infra/common/components/alert/AlertLayer';
import { Card, Typography, Button } from '@material-ui/core';
import css from './NewRoomModal.module.css';
import { OccupancySelect } from 'infra/common/components/game/OccupancySelect';
import NicknameRequired from 'infra/common/components/auth/NicknameRequired';
import { LobbyService } from 'infra/common/services/LobbyService';
import { Router, Trans, withTranslation, WithTranslation } from 'infra/i18n';
import getMessagePage from 'infra/common/factories/MessagePage';
import { room } from 'infra/navigation';
import { compose } from 'recompose';
import { IGameDef } from 'gamesShared/definitions/game';

interface NewRoomModalInnerProps extends WithTranslation {}

interface NewRoomModalOutterProps {
  game: IGameDef;
  handleClickaway: () => void;
}

interface NewRoomModalState {
  occupancy?: number;
  loading: boolean;
  error: boolean;
}

export class NewRoomModalInternal extends React.Component<
  NewRoomModalInnerProps & NewRoomModalOutterProps,
  NewRoomModalState
> {
  state = { occupancy: undefined, loading: false, error: false };

  render() {
    return (
      <NicknameRequired skipFbgBar={true}>
        <AlertLayer onClickaway={this.props.handleClickaway}>
          <Card className={css.Card}>{this.renderCardContent()}</Card>
        </AlertLayer>
      </NicknameRequired>
    );
  }

  renderCardContent() {
    const { t } = this.props;

    if (this.state.loading) {
      return getMessagePage('loading', t('loading'), true)();
    }
    if (this.state.error) {
      return getMessagePage('error', t('error_while_creating_room'), true)();
    }
    return (
      <>
        <Typography className={css.Title} variant="h5" component="h3">
          {t('new_room')}
        </Typography>
        {this.renderGameSelect()}
        {this.renderOccupancySelect()}
        {this.renderButtons()}
      </>
    );
  }

  renderGameSelect() {
    const { t, game } = this.props;

    return (
      <div>
        <Trans t={t} i18nKey="game" components={{ b: <b /> }} values={{ name: game.name }} />
      </div>
    );
  }

  _changeOccupancy = (e: ChangeEvent<{ value: number }>) => {
    this.setState({ occupancy: e.target.value });
  };

  renderOccupancySelect() {
    const game = this.props.game;
    if (game.minPlayers === game.maxPlayers) {
      return;
    }
    return (
      <div className={css.OccupancyWrapper}>
        <OccupancySelect
          selectClassName={css.OccupancySelect}
          game={game}
          value={this.state.occupancy || game.minPlayers}
          onChange={this._changeOccupancy}
        />
      </div>
    );
  }

  renderButtons() {
    const { t } = this.props;
    return (
      <div className={css.buttonsContainer}>
        <Button variant="contained" className={css.Button} onClick={this.props.handleClickaway}>
          {t('cancel')}
        </Button>
        <div className={css.buttonsSeparator}></div>
        <Button variant="contained" color="primary" className={css.Button} onClick={this._createRoom}>
          {t('create')}
        </Button>
      </div>
    );
  }

  _createRoom = () => {
    const { i18n } = this.props;
    this.setState({ loading: true });
    const occupancy = this.state.occupancy || this.props.game.minPlayers;
    LobbyService.newRoom((this.props as any).dispatch, this.props.game.code, occupancy, true).then(
      (response) => {
        // we use .replace instead of .push so that the browser back button works correctly
        Router.replace(room(response.newRoom.roomId)(i18n.language));
      },
      () => {
        this.setState({ loading: false, error: true });
      },
    );
  };
}

const enhance = compose<NewRoomModalInnerProps, NewRoomModalOutterProps>(withTranslation('NewRoomModal'));

export const NewRoomModal = enhance(NewRoomModalInternal);
