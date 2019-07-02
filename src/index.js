const ical = require('node-ical');
const { IncomingWebhook } = require('@slack/webhook');

const icalUrl = process.env.ICAL_URL;
const today = new Date();
const slackWebhook = process.env.WEBHOOK_URL;

ical.fromURL(icalUrl, {}, function(err, data) {
  if (err) console.log(err);
  let vacations = [];

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

  if (vacations) {
    const webhook = new IncomingWebhook(slackWebhook);

    // Send the notification
    (async () => {
      await webhook.send({
        text: vacations.join("\n"),
      });
    })();
  }
});

