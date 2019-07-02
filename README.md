# Slack vacations notifier

Fetch vacations from an iCal url and post to slack the people who are on vacation today.
Uses the `categories` metadata on the event, if the event has `leaves` as category it will treat is as a leave/vacation/day off.

## Installation to k8s

### Create a secret

The webshook and iCal URL needs to be created as a secret, it will be assigned as environment variable to the cron job.
Amend the name of the secret and the example cronjob spec as needed, this example uses `cronsecret` as the secret name.

```
kubectl create secret generic cronsecret --from-literal=webhook-url=https://example.com/slack --from-literal=ical-url=https://example.com/ical
kubectl apply -f kubernetes/cron.yaml
```
