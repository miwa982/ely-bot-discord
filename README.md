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
* ⏰ **Selective 18:00 (6 PM) Daily Check-in Reminders**:
  * Pings only the members who haven't completed their commissions by 18:00 UTC+7.
  * **Per-User Game Preferences**: Subscribe to only the games you actually play!
  * **Interactive Settings Panel**: Right-click any member (`Apps > Reminder Settings`) or use `/checkin-reminder settings` to pick games via a multi-select dropdown.
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
| `/daily check [game] (user)` | Marks check-in for a game (defaults to yourself, or specify a `@friend`). Valid all night until 3:00 AM UTC+7! |
| `/daily uncheck [game] (user)` | Removes check-in for a game. |
| `Right-click User → Apps → Daily Check-in` | Opens an interactive popup with buttons to toggle check-in for that member on today's active poll. |

---

### ⏰ Check-in Reminders & Selective Games

| Command / Action | Description |
| :--- | :--- |
| `Right-click User → Apps → Reminder Settings` | **(Recommended)** Opens the interactive reminder panel for that member with a multi-select dropdown to pick their games! |
| `/checkin-reminder settings (user)` | Opens the interactive game selection and reminder panel. |
| `/checkin-reminder subscribe (user) (games)` | Subscribes a user to the 18:00 reminder. Enter specific games (`gi, hsr`), or leave blank to open the dropdown menu. |
| `/checkin-reminder unsubscribe (user)` | Turns off 18:00 reminder pings for that user. |
| `/checkin-reminder status (user)` | Displays active reminder status and list of registered games. |

> [!TIP]
> **How Selective Reminders Work:**
> If you only play *Genshin Impact* and *Honkai: Star Rail*, you will **never** be pinged for *Zenless Zone Zero* or *Honkai Impact 3rd*. If you finish both of your chosen games before 18:00 UTC+7, Elysia won't ping you at all!

---

### 🌸 Game Events & Recurring Schedules

| Command | Description |
| :--- | :--- |
| `/event dashboard` | Opens the main event manager with **`➕ Add Event`**, **`⚡ Quick Presets`**, and **`🗑️ Delete`**. |
| `/event create` | Opens the event creation modal. |
| `/event list` | Displays active and upcoming events with real-time countdowns. |

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
