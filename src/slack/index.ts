import { CalendarResult, Leave, CustomEvent } from '../types';
import { SlackClientOptions, SlackClient } from './types';
import { IncomingWebhook } from "@slack/webhook";

const DEFAULT_MESSAGE = "No one is on leave today! :tada:";

const buildLeaveMessage = (leaves: Leave[]) => {
  const leaveMessages = leaves
    .map((leave) => {
      return leave.attendees
        .map((name) => `>*${name}* (last day of leave is ${leave.lastDay})`)
        .join("\n");
    })
    .join("\n");

  return `${leaveMessages || DEFAULT_MESSAGE}\n`;
};

const buildCustomEventMessage = (customEvents: CustomEvent[]) => {
  return customEvents
    .map((customEvent) => {
      const hasAttendees = customEvent.attendees.length > 0;
      return (
        `${customEvent.name}${hasAttendees ? ':':''}\n` +
        customEvent.attendees.map((attendee) => `>*${attendee}*`).join("\n")
      );
    })
    .join("\n");
};

const buildMessage = (calendarResult: CalendarResult): string => {
  const leaveMessage = buildLeaveMessage(calendarResult.leaves);
  const customEventMessage = buildCustomEventMessage(
    calendarResult.customEvent
  );
  return ['On leave:', leaveMessage, customEventMessage].join("\n");
};

export function getClient({ debug = false, webhookUrl }: SlackClientOptions): SlackClient {

  const sendMessage = async (calendarResult: CalendarResult): Promise<boolean> => {
    const message = buildMessage(calendarResult);

    console.info(
      `Sending the following message to Slack webhook:\n\n${message}`
    );

    // DEBUG skip slack message
    if (debug) {
      return true;
    }

    try {
      const webhook = new IncomingWebhook(webhookUrl);
      await webhook.send(message);
      return true;
    } catch (err) {
      console.error("Error while posting to slack", err);
      return false;
    }
  };

  return {
    sendMessage,
  };
}
