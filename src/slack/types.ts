import { CalendarResult } from '../types';

export interface SlackClientOptions {
  webhookUrl: string,
  debug?: boolean,
}

export interface SlackClient {
  sendMessage: (CalendarResult) => Promise<boolean> 
}