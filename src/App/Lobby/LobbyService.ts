import AddressHelper from '../AddressHelper';
import request from 'superagent';

export interface IPlayerInRoom {
  ID: number;
  name: string;
  credentials?: string;
}

export interface IRoomMetadata {
  gameCode: string;
  roomID: string;
}

export interface INewRoom {
  room: IRoomMetadata;
  initialPlayer: IPlayerInRoom;
}

export class LobbyService {
  public static async newRoom(gameCode: string): Promise<INewRoom> {
    const response = await request
      .post(`${AddressHelper.getServerAddress()}/games/${gameCode}/create`)
      .send({ numPlayers: 2 });
    const roomID = response.body.gameID;
    const room: IRoomMetadata = { gameCode, roomID };
    const initialPlayer: IPlayerInRoom = { ID: 0, name: 'J' };
    const credentials = await this.joinRoom(room, initialPlayer);
    initialPlayer.credentials = credentials;
    const newRoom: INewRoom = { room, initialPlayer };
    return newRoom;
  }

  public static async joinRoom(room: IRoomMetadata, player: IPlayerInRoom): Promise<string> {
    const response = await request
      .post(`${AddressHelper.getServerAddress()}/games/${room.gameCode}/${room.roomID}/join`)
      .send({
        playerID: player.ID,
        playerName: player.name,
      });
    return response.body.playerCredentials;
  }
}
