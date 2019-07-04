const ical = require('node-ical');
const { IncomingWebhook } = require('@slack/webhook');
const moment = require('moment');

const icalUrls = process.env.ICAL_URL.split(',');
const slackWebhook = process.env.WEBHOOK_URL;
const today = moment();

const icalPromises = icalUrls.map(icalUrl => {
  return new Promise((resolve, reject) => {
    ical.fromURL(icalUrl, {}, function(err, data) {
      if (err) reject(err);
      const vacations = [];

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
                nextWeek: 'dddd [next week] DD/MM',
                sameElse: 'DD/MM'
              });

              vacations.push(`${ev.attendee.params.CN} is on leave today (last day of leave is ${lastDayOfHoliday})`);
            }
          }
        }
      }

      resolve(vacations);
    });
  });
});

Promise.all(icalPromises).then((values) => {
  const vacations =  [].concat.apply([], values).sort();
  console.log(vacations);

  if (vacations.length > 0) {
    const webhook = new IncomingWebhook(slackWebhook);

    // Send the notification
    (async () => {
      await webhook.send({
        text: vacations.join("\n"),
      });
    })();
  }
});

