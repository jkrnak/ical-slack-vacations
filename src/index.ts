import { config } from 'dotenv';
import { run } from './cronjob';
import { CronJobOptions } from './types';
config();

const cronJobOptions: CronJobOptions = {
  ical: {
    url: process.env.ICAL_URL,
    categoryKey: process.env.ICAL_CATEGORY_KEY,
  },
  slack: {
    webhookUrl: process.env.WEBHOOK_URL,
  },
  debug: !!process.env.IS_DEBUG,
}

run(cronJobOptions)
  .then(() => {
    console.info('Job completed successfully.')
  })
  .catch((e) => {
    console.info('Job has failed:\n', e)
  })
