const ical = require('node-ical');
const { IncomingWebhook } = require('@slack/webhook');

const icalUrls = process.env.ICAL_URL.split(',');
const slackWebhook = process.env.WEBHOOK_URL;
const today = new Date();

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
            if (today >= ev.start && today <= ev.end) {
              const formattedStartDate = `<!date^${ev.start.getTime()/1000}^{date_short}|${ev.start.toLocaleDateString('en-GB')}>`;
              const formattedEndDate = `<!date^${ev.end.getTime()/1000}^{date_short}|${ev.end.toLocaleDateString('en-GB')}>`;
              vacations.push(`${ev.organizer.params.CN} is on leave today (between ${formattedStartDate} and ${formattedEndDate})`);
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

