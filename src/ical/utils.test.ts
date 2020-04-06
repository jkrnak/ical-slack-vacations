import moment from "moment";
import {
  processLeave,
  processCustomEvent,
  extractAttendeeNames,
} from "./utils";
import { IcalType } from "./types";

// Silence logs on tests
console.info = jest.fn();
console.error = jest.fn();

const mockLeaveEventSingle = {
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
};

const mockLeaveEventMultiple = {
  type: IcalType.VEVENT,
  params: [],
  start: moment().subtract(1, "day").toISOString(),
  end: moment().add(1, "day").toISOString(),
  summary: "Vacation",
  "CONFLUENCE-SUBCALENDAR-TYPE": "leaves",
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
};

const mockLeaveEventFuture = {
  type: IcalType.VEVENT,
  params: [],
  start: moment().add(2, "day").toISOString(),
  end: moment().add(3, "day").toISOString(),
  summary: "Vacation",
  "CONFLUENCE-SUBCALENDAR-TYPE": "leaves",
  attendee: {
    params: {
      CN: "Attendee number 1",
    },
  },
};

const mockCustomEventSingle = {
  type: IcalType.VEVENT,
  params: [],
  start: moment().toISOString(),
  end: moment().add(1, "day").toISOString(),
  summary: "National Holiday",
  "CONFLUENCE-SUBCALENDAR-TYPE": "custom",
  attendee: {
    params: {
      CN: "Attendee number 1",
    },
  },
};

const mockCustomEventMultiple = {
  type: IcalType.VEVENT,
  params: [],
  start: moment().toISOString(),
  end: moment().add(1, "day").toISOString(),
  summary: "National Holiday",
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
};

const mockCustomEventFuture = {
  type: IcalType.VEVENT,
  params: [],
  start: moment().add(2, "day").toISOString(),
  end: moment().add(3, "day").toISOString(),
  summary: "Future National Holiday",
  "CONFLUENCE-SUBCALENDAR-TYPE": "custom",
  attendee: {
    params: {
      CN: "Attendee number 1",
    },
  },
};

const mockAttendeeObj = {
  params: {
    CN: "User 1",
  },
};

const mockAttendeeArray = [
  {
    params: {
      CN: "User 1",
    },
  },
  {
    params: {
      CN: "User 2",
    },
  },
];

it("extracts attendees names correctly", async () => {
  let attendees = extractAttendeeNames(mockAttendeeObj);
  expect(attendees.length).toBe(1);
  attendees = extractAttendeeNames(mockAttendeeArray);
  expect(attendees.length).toBe(2);
});

it("process leaves correctly with one attendee", async () => {
  const leave = processLeave(mockLeaveEventSingle);
  expect(leave).toBeDefined();
  expect(leave.attendees.length).toBe(1);
  expect(leave.lastDay).toBe("tomorrow");
});

it("process leaves correctly with multiple attendees", async () => {
  const leave = processLeave(mockLeaveEventMultiple);
  expect(leave).toBeDefined();
  expect(leave.attendees.length).toBe(2);
  expect(leave.lastDay).toBe("tomorrow");
});

it("ignores and does not process leaves in the future", async () => {
  const leave = processLeave(mockLeaveEventFuture);
  expect(leave).toBeUndefined();
});

it("process custom event correctly with one attendee", async () => {
  const customEvent = processCustomEvent(mockCustomEventSingle);
  expect(customEvent).toBeDefined();
  expect(customEvent.attendees.length).toBe(1);
  expect(customEvent.name).toBe(mockCustomEventSingle.summary);
});

it("process custom event correctly with multiple attendee", async () => {
  const customEvent = processCustomEvent(mockCustomEventMultiple);
  expect(customEvent).toBeDefined();
  expect(customEvent.attendees.length).toBe(2);
  expect(customEvent.name).toBe(mockCustomEventSingle.summary);
});

it("ignores and does not process custom event in the future", async () => {
  const customEvent = processCustomEvent(mockCustomEventFuture);
  expect(customEvent).toBeUndefined();
});
