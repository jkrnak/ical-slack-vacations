export interface CronJobOptions {
  ical: {
    url: string,
    categoryKey?: string
  },
  slack: {
    webhookUrl: string
  },
  debug: boolean
}

export interface CalendarResult {
  leaves: Leave[],
  customEvent: CustomEvent[],
}

export interface CustomEvent {
  name: string,
  attendees: string[],
}

export interface Leave {
  name?: string,
  attendees: string[],
  lastDay: string,
}
