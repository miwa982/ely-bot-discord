# 🌸 Elysia Discord Bot ♪

<p align="center">
  <img src="https://media.tenor.com/eg4wZXTtkLYAAAAj/elysia-miss-pink-elf.gif" alt="Elysia Miss Pink Elf" width="360" />
</p>

<p align="center">
  <i>"Hi~ Did you wake early just so you could see me sooner? That makes me so happy! 🎶"<br/>
  "Miss Pink Elf is here to make your server as lovely, organized, and lively as can be!"</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22.x-brightgreen?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Discord.js-v14-5865F2?style=flat-square&logo=discord" alt="Discord.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Timezone-UTC%2B7%20(Asia%2FBangkok)-ff69b4?style=flat-square" alt="Timezone" />
</p>

---

## ✨ Features at a Glance

* 🎮 **Interactive Daily Commissions Checklist**:
  * Automatically posted every day at **03:00 UTC+7** (aligned with the Hoyoverse server reset).
  * Interactive toggle buttons with custom emojis for *Genshin Impact*, *Honkai: Star Rail*, *Honkai Impact 3rd*, *Zenless Zone Zero*, *Wuthering Waves*, and *Miliastra Wonderland*.
  * **Valid until 03:00 AM UTC+7**: Check in for yourself or friends all night long without getting cut off at midnight!
  * 🌸 **03:00 AM Finalized Recap Embed**: Before each reset, Elysia sends a finalized report summarizing check-in results for everyone with an assigned reminder!
* ⏰ **Customizable Daily Check-in Reminders**:
  * **Per-User Preferred Ping Time**: Choose when you want Elysia to ping you (e.g. 12:00, 18:00, 20:00, 22:00 UTC+7).
  * **Per-User Game Selection**: Choose only the games you actually play!
  * **Interactive Settings Panel**: Right-click any member (`Apps > Reminder Settings`) or use `/checkin-reminder settings` to pick games and custom ping time via dropdown menus.
* 🌸 **Game Events & Permanent Schedule Manager**:
  * Full dashboard with one-click **Quick Presets** for Honkai Impact 3rd Abyss, Elysian Realm, Memorial Arena, and Hoyoverse Weekly Reset.
  * **Self-Healing & Permanent**: Weekly and interval events automatically roll over forever across bot restarts and downtimes.
  * Start alerts, custom countdown reminder thresholds (`1d, 2h, 1h, 30m`), and cycle conclusion notices.
* 📌 **Personal & Server Task Checklists**:
  * Track daily and weekly to-do lists with interactive statuses (`TODO 👀`, `IN PROGRESS ⌛`, `DONE ✅`).
  * Automated daily checklists posted at 03:00 and daily progress reminders at 18:00.
* 🎂 **Birthday Celebrations**:
  * Celebrates members' birthdays at 07:00 UTC+7 with heartfelt wishes.
  * Elysia's very own birthday on November 11 (*"Candles... Of course we'll have 17♪"*).
* ⚙️ **Server Channel Configuration**:
  * Dedicated notification channels for `daily`, `birthday`, `event`, and `checklist`, or assign one channel for `all`.

---

## 📖 Elysia's Command Guide

### 🎮 Daily Hoyoverse Commissions

| Command / Action | Description |
| :--- | :--- |
| `/daily send` | Posts today's interactive daily check-in poll in the current channel. |
| `/daily recap` | Generates the finalized check-in results embed for all reminder subscribers for the concluding cycle. |
| `/daily check [game] (user)` | Marks check-in for a game (defaults to yourself, or specify a `@friend`). Valid all night until 3:00 AM UTC+7! |
| `/daily uncheck [game] (user)` | Removes check-in for a game. |
| `Right-click User → Apps → Daily Check-in` | Opens an interactive popup with buttons to toggle check-in for that member on today's active poll. |

> [!NOTE]
> **03:00 AM Finalized Recap Embed:**
> At 03:00 AM UTC+7 (Hoyoverse daily reset), Elysia automatically posts a beautiful summary embed to the daily channel showing the finalized results for all reminder subscribers (highlighting All Clears, completed counts, and any missed games) right before opening the new cycle's poll!

---

### ⏰ Check-in Reminders & Customizable Ping Times

| Command / Action | Description |
| :--- | :--- |
| `Right-click User → Apps → Reminder Settings` | **(Recommended)** Opens the interactive reminder panel for that member with dropdowns to pick their games AND their custom ping time! |
| `/checkin-reminder settings (user)` | Opens the interactive game selection and reminder panel. |
| `/checkin-reminder subscribe (user) (hour) (games)` | Subscribes a user with an optional custom hour (0–23 UTC+7, default 18:00) and specific games (`gi, hsr`), or leave blank to open the dropdown menu. |
| `/checkin-reminder unsubscribe (user)` | Turns off daily reminder pings for that user. |
| `/checkin-reminder status (user)` | Displays active reminder status, ping time, and list of registered games. |

> [!TIP]
> **How Selective Reminders Work:**
> - **Custom Hours:** You can choose when Elysia pings you (e.g. 12:00, 18:00, 20:00, 22:00, etc. in UTC+7).
> - **Zero Spam:** If you only play *Genshin Impact* and *Honkai: Star Rail*, you will **never** be pinged for *Zenless Zone Zero* or *Honkai Impact 3rd*. If you finish your chosen games before your reminder time, Elysia won't ping you at all!

---

### 🌸 Game Events & Recurring Schedules

| Command | Description |
| :--- | :--- |
| `/event dashboard` | Opens the main interactive event manager with **`➕ Add Event`**, **`⚡ Quick Presets`**, **`✏️ Edit Event`**, **`🗑️ Delete Event`**, and **`🔄 Refresh`**. |
| `/event list` | Displays a clean, public timetable of ongoing and upcoming events with real-time countdowns. |
| `/event create` | Opens the event creation modal. |
| `/event edit` | Selects an existing event and opens a pre-filled modal to edit its schedule, reminders, title, or notes. |

#### Schedule Format Examples:
* **Weekly Cycles (Permanent)**: `Mon 14:00 - Wed 21:00` or `Fri 2PM - Sun 9PM` *(Automatically rolls over every week)*.
* **Interval Cycles (Permanent)**: `Every 14d` or `Every 3d` *(Automatically advances dates forever)*.
* **One-time Events**: `2026-09-01 10:00 - 2026-09-15 18:00`.
* **Dynamic Reminders**: `1d, 2h, 1h, 30m` *(Sends countdown reminders before cycle ends)*.

---

### 📌 Task Checklists

| Command | Description |
| :--- | :--- |
| `/checklist create [type]` | Creates a new `DAILY` or `WEEKLY` checklist for yourself. |
| `/checklist view [type]` | Views your checklist. Click buttons to add, edit, or remove tasks and toggle status (`TODO 👀`, `IN PROGRESS ⌛`, `DONE ✅`). |

---

### 🎂 Birthday Celebrations

| Command | Description |
| :--- | :--- |
| `/birthday set [month] [day] (user)` | Registers a birthday. |
| `/birthday view (user)` | Checks birthday date and countdown. |
| `/birthday list` | Lists upcoming birthdays in the server. |
| `/birthday remove (user)` | Removes a birthday registration. |

---

### ⚙️ Server Configuration

| Command | Description |
| :--- | :--- |
| `/config set-channel [type] [channel]` | Assigns a channel for `all`, `daily`, `birthday`, `event`, or `checklist`. *(Requires Manage Server permission)* |
| `/config view` | Displays currently configured channels and active fallback channels. |
| `/config reset [type]` | Resets channel settings back to server defaults. |

---

## 🛠️ Installation & Setup

### 1. Prerequisites
* **Node.js**: `v22.x` or later (tested on `v24.x`).
* **MongoDB**: A running MongoDB instance (local or MongoDB Atlas).
* **Discord Bot**: A registered application on the [Discord Developer Portal](https://discord.com/developers/applications) with:
  * `Server Members Intent` enabled.
  * `Message Content Intent` enabled.

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_bot_client_id_here
DB_URL=mongodb://localhost:27017/elysia_bot
DAILY_CHANNEL_ID=your_fallback_daily_channel_id_here
DEV_ID=your_discord_user_id_here
TEST_GUILD_ID=your_development_guild_id_here
```

### 3. Install Dependencies & Start

```bash
# Install packages
npm install

# Start Elysia
npm run start
```

---

## 🕒 Timezone & Reset Reference

* **Default Timezone**: `Asia/Bangkok` (UTC+7).
* **Hoyoverse Commissions Reset**: `03:00 UTC+7` (`04:00 UTC+8` server time).
* **Daily Commissions Poll**: Posted automatically every morning at `03:00 UTC+7`.
* **Daily Check-in Reminder**: Sent every evening at `18:00 UTC+7`.
* **Checklist Creation & Reminders**: Created at `03:00 UTC+7`, reminded at `18:00 UTC+7`.
* **Birthday Announcements**: Celebrated every morning at `07:00 UTC+7`.

---

<p align="center">
  Made with ❤️ for Elysia and Honkai lovers everywhere.<br/>
  <i>"Remember, keep your elegance and move forward with poise♪"</i>
</p>
