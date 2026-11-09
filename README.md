# Screen Saver

Screen Saver is a screen-time control app. You keep a few profiles, put distracting apps into groups that share a daily budget, and choose the hours those apps are allowed. Opening a limited app shows your message and a countdown. When the budget, the open cap, the cooldown, or the schedule says no, you get a block screen.

Time and rules stay in this browser. Screen Saver does not see or block apps installed on your phone. The launcher on this page is the phone.

## Run

```bash
npm install
npm run dev
```

## What you start with

Weekday limits Social — Instagram, TikTok, X, YouTube, and Reddit — to 120 shared minutes, with a 5 second pause and the message “Is this important?” On weekdays those apps are only open 12:00–13:00 and 18:00–21:00. The Weekday profile itself is active 7:00–23:00.

Weekend is looser: 180 minutes, a 3 second pause, and hours from 10:00–22:00. After hours is the fallback when neither schedule matches, with a 30 minute budget.
