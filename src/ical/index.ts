import { IcalEvent, IcalClientOptions, IcalType } from "./types";
import { processLeave, processCustomEvent } from "./utils";
import { CalendarResult } from "../types";
import ical from "node-ical";
import merge from "deepmerge";

export async function fetchInfo(
  url: string,
  { debug = false, categoryKey = "categories" }: IcalClientOptions
): Promise<CalendarResult> {
  const icalUrls = url.split(",");
  const icalPromises = icalUrls.map(
    (icalUrl): Promise<CalendarResult> => {
      return new Promise((resolve, reject) => {
        ical
          .fromURL(icalUrl, {}, function (err: Error, icalData: any) {
            if (err) reject(err);

            console.info("Data read from ical url successfully.");
            console.info("Using category key:", categoryKey);
            console.info(`Calendar has ${Object.keys(icalData).length} entries`)

            let calendarResult: CalendarResult = {
              leaves: [],
              customEvent: [],
            };

            Object.keys(icalData).forEach((key) => {
              const event: IcalEvent = icalData[key];
              const isEvent = event.type == IcalType.VEVENT;
              const hasCategoryKey = categoryKey in event;
              const hasAttendee = event.attendee;

              if (!isEvent || !hasCategoryKey) {
                return;
              }

              const eventCategory: string = event[categoryKey];
              const isLeave = eventCategory.includes("leaves");
              const isCustomEvent = eventCategory.includes("custom");

              if (isCustomEvent) {
                const customEvent = processCustomEvent(event);
                if (customEvent) {
                  calendarResult.customEvent.push(customEvent);
                }
                return;
              }

              if (isLeave && hasAttendee) {
                const leave = processLeave(event);
                if (leave) {
                  calendarResult.leaves.push(processLeave(event));
                }
              }

            });

            console.info("Finished processing all events.");

            resolve(calendarResult);
          });
      });
    }
  );

  return Promise.all(icalPromises)
    .then(calendarResults => merge.all<CalendarResult>(calendarResults))
    .catch((e) => {
      console.error("Failed processing all events:\n", e);
      return e;
    });
}
