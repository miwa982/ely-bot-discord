import { MessageFlags } from "discord.js";

export const BOT_CONFIG = {
  DAILY_CHANNEL_ENV: "DAILY_CHANNEL_ID",
  DEFAULT_TIMEZONE: "Asia/Bangkok",
  EMBED_COLOR: 0xec82b0,
  TASKS_PER_PAGE: 5,
};

export const DISCORD_FLAGS = {
  EPHEMERAL: MessageFlags.Ephemeral,
};

export const CHECKLIST_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
};

export const CHECKLIST_TYPE_CHOICES = [
  { name: "DAILY", value: CHECKLIST_TYPES.DAILY },
  { name: "WEEKLY", value: CHECKLIST_TYPES.WEEKLY },
];

export const TASK_STATUSES = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
};

export const TASK_STATUS_UI = {
  [TASK_STATUSES.TODO]: { name: "TODO 👀", code: TASK_STATUSES.TODO },
  [TASK_STATUSES.IN_PROGRESS]: {
    name: "IN PROGRESS... ⌛",
    code: TASK_STATUSES.IN_PROGRESS,
  },
  [TASK_STATUSES.DONE]: { name: "DONE ✅", code: TASK_STATUSES.DONE },
};

export const DAILY_GAMES = [
  { code: "gi", label: "Genshin Impact", emojiId: "1407766466459340900" },
  { code: "hsr", label: "Honkai: Star Rail", emojiId: "1407766457923796992" },
  { code: "hi3", label: "Honkai Impact 3rd", emojiId: "1407766445978554379" },
  { code: "zzz", label: "Zenless Zone Zero", emojiId: "1407987904822771732" },
  { code: "ww", label: "Wuthering Waves", emojiId: "1407987893087113277" },
  { code: "miliastra", label: "Miliastra Wonderland", emojiId: "1546174118871834724" },
];

export const TASK_SUGGESTIONS = [
  { name: "HI3 Infinity Abyss", value: "hi3abyss" },
  { name: "HI3 Elysian Realm", value: "hi3er" },
  { name: "HI3 Memorial Arena", value: "hi3ma" },
  { name: "GI Spiral Abyss", value: "giabyss" },
  { name: "GI Imaginarium Theater", value: "githeater" },
  { name: "GI Stygian Onslaught", value: "giso" },
  { name: "GI Weekly Bosses", value: "giweeklybosses" },
  { name: "GI Miliastra Wonderland", value: "gimiliastra" },
  { name: "HSR Memory of Chaos", value: "hsrmoc" },
  { name: "HSR Pure Fiction", value: "hsrpf" },
  { name: "HSR Apocalypse Shadow", value: "hsras" },
  { name: "HSR Simulated/Divergent/Currency", value: "hsrsuducw" },
  { name: "HSR Weekly Bosses", value: "hsrweeklybosses" },
  { name: "Material Farming", value: "farm" },
];
