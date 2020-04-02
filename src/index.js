const ical = require('node-ical');
const { IncomingWebhook } = require('@slack/webhook');
const moment = require('moment');
const merge = require('deepmerge');
const dotenv = require('dotenv');

dotenv.config();

const icalUrls = process.env.ICAL_URL.split(',');
const icalCategoryKey = process.env.ICAL_CATEGORY_KEY || 'categories'
const slackWebhook = process.env.WEBHOOK_URL;
const today = moment();

const extractAttendeeNames = (attendeeObj) => {
  // Attendee can be an Object if only one entry, Array otherwise
  const attendeeArray = Array.isArray(attendeeObj) ? attendeeObj : [attendeeObj]

  return attendeeArray
    .filter( attendee => attendee && attendee.params && attendee.params.CN )
    .map(attendee => attendee.params.CN);
}

const icalPromises = icalUrls.map(icalUrl => {
  return new Promise((resolve, reject) => {
    ical.fromURL(icalUrl, {}, function (err, data) {
      if (err) reject(err);

      console.info('Data read from ical url successfully.')
      console.info('Using category key:', icalCategoryKey)

      const calEvents = {
        "leave": [],
        "publicHolidays": {}
      };

      for (let k in data) {
        if (data.hasOwnProperty(k)) {
          const ev = data[k];

          if (ev.type !== 'VEVENT' || !(icalCategoryKey in ev)) {
            continue;
          }

          if (data[k][icalCategoryKey].indexOf('leaves') > -1) {
            const start = moment(ev.start);
            const end = moment(ev.end).subtract(1, 'seconds');

            if (today.isBetween(start, end)) {
              const lastDayOfHoliday = moment(end).calendar(null, {
                sameDay: '[today]',
                nextDay: '[tomorrow]',
                nextWeek: 'dddd DD/MM',
                sameElse: 'DD/MM'
              });

              // Ignore events without attendees
              if (!ev.attendee) {
                continue;
              }

              attendeeNames = extractAttendeeNames(ev.attendee)
              calEvents["leave"].push(
                ...attendeeNames.map((name) => { return `>*${name}* (last day of leave is ${lastDayOfHoliday})` })
              );
            }
          }

          if (data[k][icalCategoryKey].indexOf('Public Holiday') > -1 ) {
            const start = moment(ev.start);

            if (start.isSame(today, 'day')) {
              if (!calEvents["publicHolidays"].hasOwnProperty(ev.summary)) {
                calEvents["publicHolidays"][ev.summary] = [];
              }

              attendeeNames = extractAttendeeNames(ev.attendee)
              calEvents["publicHolidays"][ev.summary].push(
                ...attendeeNames.map((name) => { return `>*${ev.attendee[i].params.CN}*` })
              );
            }
          }
        }
      }

      console.info('Finished processing all events.')

      resolve(calEvents);
    });
  }).catch((error) => {
    console.error(`Error processing calendar: ${error}`);
  });
});

Promise.all(icalPromises).then((values) => {
  const vacations = merge.all(values);
  let leaveStatus = publicHolidaysStatus = "";
  let statusMessage = "No one is on leave today! :tada:";

  if (vacations.leave.length > 0) {
    leaveStatus = `On Leave:\n${vacations.leave.join('\n')}`;
  }

  if (Object.keys(vacations.publicHolidays).length > 0) {
    for (let k in vacations.publicHolidays) {
      publicHolidaysStatus += `\n${k}:\n${vacations.publicHolidays[k].join('\n')}`;
    }
  }

  if (leaveStatus.length > 0 || publicHolidaysStatus.length > 0) {
    statusMessage = `${leaveStatus}\n${publicHolidaysStatus}`;
  }

  console.info('Sending the following message to Slack webhook:\n\n', statusMessage);

  const webhook = new IncomingWebhook(slackWebhook);
  // Send the notification
  (async () => {
    try {
      await webhook.send({
        text: statusMessage,
      });
    } catch (err) {
      console.error("Error while posting to slack\n", err);
    }
  })();
  console.info('Job completed successfully.')
}).catch(err => {
  console.error("Error while parsing the iCal calendars", err);
});
