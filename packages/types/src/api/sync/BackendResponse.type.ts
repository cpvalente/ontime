import { MaybeString } from '../../utils/utils.type';
import { SyncRoll } from './wsApi.type';

export type SyncClientList = { id: string; roll: SyncRoll; name: string; host: MaybeString }[];
export type SyncHostConnectionRequest = {host: string, roll: SyncRoll}