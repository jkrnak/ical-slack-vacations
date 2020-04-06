import { CalendarResult } from '../types';

export interface IcalClient {
  fetchIcal: (string) => Promise<CalendarResult>
}

export interface IcalClientOptions {
  categoryKey?: string,
  debug: boolean,
}

export interface IcalEvent {
  type: IcalType,
  params: object[],
  attendee?: AttendeeElement,
  start?: string,
  end?: string,
  summary?: string,
  description?: string,
  location?: string,
}

export enum IcalType {
  VEVENT = 'VEVENT',
  VTODO = 'VTODO',
  VJOURNAL = 'VJOURNAL',
  VFREEBUSY = 'VFREEBUSY',
}

export type AttendeeElement = Attendee | Attendee[];

interface Attendee {
  params?: {
    CN: string
  }
}