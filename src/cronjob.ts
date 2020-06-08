import { CronJobOptions } from "./types";
import * as ical from "./ical";
import * as slack from "./slack";

export async function run({
  debug = false,
  slack: slackOptions,
  ical: icalOptions,
}: CronJobOptions) {
  const slackClient = slack.getClient({
    webhookUrl: slackOptions.webhookUrl,
    debug,
  });

  debug && console.log("Is running on DEBUG mode.");

  try {
    const calendarResult = await ical.fetchInfo(icalOptions.url, {
      debug,
      categoryKey: icalOptions.categoryKey,
    });
    await slackClient.sendMessage(calendarResult);
  } catch (err) {
    console.error(err);
  }
}
