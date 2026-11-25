---
no: 3
title: A like is a pull request
summary: Modelling matches in Merge as requests you merge or decline.
date: 2026-11-24
topic: Data model
project: Merge
sample: true
---

:::tldr
In Merge, liking a photo or a prompt answer opens a pull request on that person's profile. They merge it or decline it. One row with three states carries the whole decision, and a unique constraint keeps it to one request from you to them.
:::

Most dating apps store a like as a row in a likes table and work out the match later, when the second like arrives. Merge treats the first like as a request waiting on a decision. That is what a pull request is, so that is what the table is called.

## What a request stores

A request points at the exact thing that was liked: one photo or one prompt answer. It also keeps a copy of that answer. If the person edits their profile afterwards, the request still shows what was liked at the time.

:::aside
same idea as git: history is never rewritten
:::

```ts title="packages/database/src/schema.ts"
export const pullRequestStatus = pgEnum('pull_request_status', [
  'PENDING', 'MERGED', 'DECLINED',
]);

// one request from you to them
unique('pull_requests_sender_recipient_unique')
  .on(table.senderUserId, table.recipientUserId),
```

## Merging creates the match

A match is an ordered pair of people with its own unique constraint. Two people cannot match twice, whichever of them sent the request and however many times the app retries.

:::aside
one row per pair, per direction
:::
