const ical = require('node-ical');
const { IncomingWebhook } = require('@slack/webhook');
const moment = require('moment');
const merge = require('deepmerge');

const icalUrls = process.env.ICAL_URL.split(',');
const slackWebhook = process.env.WEBHOOK_URL;
const today = moment();

const icalPromises = icalUrls.map(icalUrl => {
  return new Promise((resolve, reject) => {
    ical.fromURL(icalUrl, {}, function(err, data) {
      if (err) reject(err);
      const calEvents = {
        "leave": [],
        "publicHolidays": {}
      };

      for (let k in data) {
        if (data.hasOwnProperty(k)) {
          const ev = data[k];

          if (ev.type !== 'VEVENT' || !('categories' in ev)) {
            continue;
          }

          if (data[k].categories.indexOf('leaves') > -1 ) {
            const start = moment(ev.start);
            const end = moment(ev.end).subtract(1, 'seconds');

            if (today.isBetween(start, end)) {
              const lastDayOfHoliday = moment(end).calendar( null, {
                sameDay:  '[today]',
                nextDay:  '[tomorrow]',
                nextWeek: 'dddd DD/MM',
                sameElse: 'DD/MM'
              });

              calEvents["leave"].push(`>*${ev.attendee.params.CN}* (last day of leave is ${lastDayOfHoliday})`);
            }
          }

          if (data[k].categories.indexOf('Public Holiday') > -1 ) {
            const start = moment(ev.start);

            if (start.isSame(today, 'day')) {
              if (!calEvents["publicHolidays"].hasOwnProperty(ev.summary)) {
                calEvents["publicHolidays"][ev.summary] = [];
              }

              for (let i in ev.attendee) {
                calEvents["publicHolidays"][ev.summary].push(`>*${ev.attendee[i].params.CN}*`);
              }
            }
          }
        }
      }

      resolve(calEvents);
    });
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

  const webhook = new IncomingWebhook(slackWebhook);
  // Send the notification
  (async () => {
    await webhook.send({
      text: statusMessage,
    });
  })();
});

