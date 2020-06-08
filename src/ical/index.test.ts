import moment from "moment";
import ical from "node-ical";
import { fetchInfo } from "./index";
import { IcalType, IcalClientOptions } from './types';

// Silence logs on tests
console.info = jest.fn();
console.error = jest.fn();

const mockCalendarEvent = {
  Event1: {
    type: IcalType.VEVENT,
    params: [],
    start: moment().subtract(1, "day").toISOString(),
    end: moment().add(1, "day").toISOString(),
    summary: "Vacation",
    "CONFLUENCE-SUBCALENDAR-TYPE": "leaves",
    attendee: {
      params: {
        CN: "Attendee number 1",
      },
    },
  },
  Event2: {
    type: "VEVENT",
    params: [],
    start: moment().toISOString(),
    end: moment().add(1, "day").toISOString(),
    summary: "Vacation",
    "CONFLUENCE-SUBCALENDAR-TYPE": "custom",
    attendee: [
      {
        params: {
          CN: "Attendee number 1",
        },
      },
      {
        params: {
          CN: "Attendee number 2",
        },
      },
    ],
  },
};

const mockCalendarEventNoAttendee = {
  Event1: {
    type: IcalType.VEVENT,
    params: [],
    start: moment().subtract(1, "day").toISOString(),
    end: moment().add(1, "day").toISOString(),
    summary: "Vacation",
    "CONFLUENCE-SUBCALENDAR-TYPE": "leaves",
    attendee: null,
  },
  Event2: {
    type: IcalType.VEVENT,
    params: [],
    start: moment().toISOString(),
    end: moment().toISOString(),
    summary: "Anonymous Holiday",
    "CONFLUENCE-SUBCALENDAR-TYPE": "custom",
    attendee: null,
  },
};

const mockCalendarEventFuture = {
  Event1: {
    type: IcalType.VEVENT,
    params: [],
    start: moment().add(2, "day").toISOString(),
    end: moment().add(3, "day").toISOString(),
    summary: "Future Vacation",
    "CONFLUENCE-SUBCALENDAR-TYPE": "leaves",
    attendee: {
      params: {
        CN: "Attendee number 1",
      },
    },
  },
  Event2: {
    type: IcalType.VEVENT,
    params: [],
    start: moment().add(2, "day").toISOString(),
    end: moment().add(3, "day").toISOString(),
    summary: "Future Holiday",
    "CONFLUENCE-SUBCALENDAR-TYPE": "custom",
    attendee: null,
  },
};

const mockCalendarEventDefaultCategoryKey = {
  Event1: {
    type: IcalType.VEVENT,
    params: [],
    start: moment().subtract(1, "day").toISOString(),
    end: moment().add(1, "day").toISOString(),
    summary: "Vacation",
    categories: "leaves",
    attendee: {
      params: {
        CN: "Attendee number 1",
      },
    },
  },
  Event2: {
    type: "VEVENT",
    params: [],
    start: moment().toISOString(),
    end: moment().add(1, "day").toISOString(),
    summary: "Vacation",
    categories: "custom",
    attendee: [
      {
        params: {
          CN: "Attendee number 1",
        },
      },
      {
        params: {
          CN: "Attendee number 2",
        },
      },
    ],
  },
};

const mockCalendarNotEvent = {
  Event1: {
    type: IcalType.VTODO,
    params: [],
    start: moment().subtract(1, "day").toISOString(),
    end: moment().add(1, "day").toISOString(),
    summary: "Todo event",
    attendee: {
      params: {
        CN: "Attendee number 1",
      },
    },
  },
};

const mockIcalFromUrl = (error: Error, eventObject: any) => {
  ical.fromURL = (url, options, callback) => {
    callback(error, eventObject);
  };
}

it("has leaves and public holidays", async () => {
  mockIcalFromUrl(null, mockCalendarEvent);

  const calendarResult = await fetchInfo("https://mock.url", {
    debug: true,
    categoryKey: "CONFLUENCE-SUBCALENDAR-TYPE",
  });
  expect(calendarResult.leaves.length).toBe(1);
  expect(calendarResult.customEvent.length).toBe(1);
  expect(calendarResult.customEvent[0].attendees.length).toBe(2);
});

it("ignores leaves and national holidays in the future", async () => {
  mockIcalFromUrl(null, mockCalendarEventFuture);

  const calendarResult = await fetchInfo("https://mock.url", {
    debug: true,
    categoryKey: "CONFLUENCE-SUBCALENDAR-TYPE",
  });
  expect(calendarResult.leaves.length).toBe(0);
  expect(calendarResult.customEvent.length).toBe(0);
});

it("ignores non VEVENT calendar events", async () => {
  mockIcalFromUrl(null, mockCalendarNotEvent);

  const calendarResult = await fetchInfo("https://mock.url", {
    debug: true,
    categoryKey: "CONFLUENCE-SUBCALENDAR-TYPE",
  });
  expect(calendarResult.leaves.length).toBe(0);
  expect(calendarResult.customEvent.length).toBe(0);
});

it("handles and ignores leaves without attendees and accepts national holiday without attendees", async () => {
  mockIcalFromUrl(null, mockCalendarEventNoAttendee);

  const calendarResult = await fetchInfo("https://mock.url", {
    debug: true,
    categoryKey: "CONFLUENCE-SUBCALENDAR-TYPE",
  });
  expect(calendarResult.leaves.length).toBe(0);
  expect(calendarResult.customEvent.length).toBe(1);
});

it("handles default client options", async () => {
  mockIcalFromUrl(null, mockCalendarEventDefaultCategoryKey);

  // @ts-ignore: default behaviour test
  const icalOptions: IcalClientOptions = {};
  const calendarResult = await fetchInfo("https://mock.url", icalOptions);
  expect(calendarResult.leaves.length).toBe(1);
  expect(calendarResult.customEvent.length).toBe(1);
});

it("handles fetch issues", async () => {
  mockIcalFromUrl(new Error('There was an error with fetching.'), null);

  try {
    const calendarResult = await fetchInfo("https://mock.url", {
      debug: true,
      categoryKey: "CONFLUENCE-SUBCALENDAR-TYPE",
    });
  } catch (err) {
    expect(err).toBeInstanceOf(Error);
    expect(console.error).toHaveBeenCalled();
  }
});
