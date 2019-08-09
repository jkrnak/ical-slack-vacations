
const { fromURL } = require('node-ical');
const { IncomingWebhook } = require('@slack/webhook');
const moment = require('moment');
const merge = require('deepmerge');

const icalUrls = process.env.ICAL_URL.split(',');
const slackWebhook = process.env.WEBHOOK_URL;
const today = moment();

const icalPromises = icalUrls.map(icalUrl => new Promise((resolve, reject) => {
  fromURL(icalUrl, {}, (err, data) => {
    if (err) reject(err);
    const calEvents = {
      leave: [],
      publicHolidays: {},
    };

    Object.values(data).forEach((ev) => {
      if (ev.type !== 'VEVENT' || !('categories' in ev)) {
        return;
      }

      if (ev.categories.indexOf('leaves') > -1) {
        const start = moment(ev.start);
        const end = moment(ev.end).subtract(1, 'seconds');

        if (today.isBetween(start, end)) {
          const lastDayOfHoliday = moment(end).calendar(null, {
            sameDay: '[today]',
            nextDay: '[tomorrow]',
            nextWeek: 'dddd DD/MM',
            sameElse: 'DD/MM',
          });

          calEvents.leave.push(`>*${ev.attendee.params.CN}* (last day of leave is ${lastDayOfHoliday})`);
        }
      }

      if (ev.categories.indexOf('Public Holiday') > -1) {
        const start = moment(ev.start);

        if (start.isSame(today, 'day')) {
          if (!Object.prototype.hasOwnProperty.call(calEvents.publicHolidays, ev.summary)) {
            calEvents.publicHolidays[ev.summary] = [];
          }

          Object.values(ev.attendee).forEach((attendee) => {
            calEvents.publicHolidays[ev.summary].push(`>*${attendee.params.CN}*`);
          });
        }
      }
    });

    resolve(calEvents);
  });
}));

Promise.all(icalPromises).then((values) => {
  const vacations = merge.all(values);
  let leaveStatus = '';
  let publicHolidaysStatus = '';
  let statusMessage = 'No one is on leave today! :tada:';

  if (vacations.leave.length > 0) {
    leaveStatus = `On Leave:\n${vacations.leave.join('\n')}`;
  }

  if (Object.keys(vacations.publicHolidays).length > 0) {
    Object.keys(vacations.publicHolidays).forEach((key) => {
      publicHolidaysStatus += `\n${key}:\n${vacations.publicHolidays[key].join('\n')}`;
    });
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
