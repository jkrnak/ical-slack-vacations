import { AttendeeElement, IcalEvent } from './types';
import moment from 'moment';
import { Leave, CustomEvent } from '../types';
const TODAY = moment();

export const extractAttendeeNames = (attendeeObj: AttendeeElement): string[] => {
  // Attendee can be an Object if only one entry, Array otherwise
  const attendeeArray = [].concat(attendeeObj);

  return attendeeArray
    .filter( attendee => attendee && attendee.params && attendee.params.CN )
    .map(attendee => attendee.params.CN);
}

export const processLeave = (event: IcalEvent): Leave => {
  const start = moment(event.start);
  const end = moment(event.end).subtract(1, "seconds");

  if (!TODAY.isBetween(start, end)) {
    return;
  }

  const lastDay = moment(end).calendar(null, {
    sameDay: "[today]",
    nextDay: "[tomorrow]",
    nextWeek: "dddd DD/MM",
    sameElse: "DD/MM",
  });

  return {
    name: event.summary,
    attendees: extractAttendeeNames(event.attendee),
    lastDay,
  };
};

export const processCustomEvent = (event: IcalEvent): CustomEvent => {
  const start = moment(event.start);
  if (!start.isSame(TODAY, "day")) {
    return;
  }
  return {
    name: event.summary,
    attendees: extractAttendeeNames(event.attendee),
  };
};