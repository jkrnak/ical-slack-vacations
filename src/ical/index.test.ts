import moment from 'moment';
import ical from 'node-ical';
import { fetchInfo } from './index'

const mockCalendarEvent = {
  "Event1": {
    "type": "VEVENT",
    "params": [],
    "start": moment().subtract(1, 'day').toISOString(),
    "end": moment().add(1, 'day').toISOString(),
    "summary": "Vacation",
    "CONFLUENCE-SUBCALENDAR-TYPE": "leaves",
    "attendee": {
      "params": {
        "CN": "Attendee number 1",
      }
    },
  },
  "Event2": {
    "type": "VEVENT",
    "params": [],
    "start": moment().toISOString(),
    "end": moment().add(1, 'day').toISOString(),
    "summary": "Vacation",
    "CONFLUENCE-SUBCALENDAR-TYPE": "custom",
    "attendee": [
      {
        "params": {
          "CN": "Attendee number 1",
        }
      },
      {
        "params": {
          "CN": "Attendee number 2",
        }
      },
    ],
  },
}

it('it has leaves and public holidays', async () => {
  ical.fromURL = (url, options, callback) => {
    callback(null, mockCalendarEvent)
  }

  const calendarResult = await fetchInfo("https://mock.url", { debug: true, categoryKey: 'CONFLUENCE-SUBCALENDAR-TYPE' })
  expect(calendarResult.leaves.length).toBe(1);
  expect(calendarResult.customEvent.length).toBe(1);
  expect(calendarResult.customEvent[0].attendees.length).toBe(2);
})