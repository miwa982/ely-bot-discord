import enumData from "../../enum/enumData.js";
import addTaskModal from "../../commands/Modals/addTaskModal.js";
import editTaskModal from "../../commands/Modals/editTaskModal.js";
import { BOT_CONFIG, CHECKLIST_TYPES, DISCORD_FLAGS, TASK_STATUS_UI } from "../../constants/bot.js";
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import { EmbedBuilder } from "discord.js";
import ChecklistSchema from "../../db/Checklist/checklistSchema.js";
import TaskSchema from "../../db/Checklist/taskSchema.js";
import removeTaskModal from "../../commands/Modals/removeTaskModal.js";
import daily from "../../commands/daily.js";

const countDoneTasks = (items) => {
  return items.filter(
    (item) => item.status === enumData.TaskStatusType.DONE.code,
  ).length;
};

export default async (interaction, client) => {
  if (interaction.isModalSubmit()) {
    const type = interaction.customId.split(":")[1];
    try {
      switch (interaction.customId) {
        case `add-task-modal:${type}`: //add task
        {
          const taskInputValue =
            interaction.fields.getTextInputValue("input-task") ?? "";
          const selectValue =
            interaction.fields.getStringSelectValues("select-task") ?? "";
          if (taskInputValue && selectValue[0]) {
            return interaction.reply({
              content:
                "❌ You must either type a new task OR select a suggestion!",
              flags: DISCORD_FLAGS.EPHEMERAL,
            });
          }
          if (!taskInputValue && !selectValue[0]) {
            return interaction.reply({
              content:
                "❌ You must either type a new task OR select a suggestion!",
              flags: DISCORD_FLAGS.EPHEMERAL,
            });
          }
          const taskName = taskInputValue || selectValue[0];
          const type = interaction.customId.split(":")[1];
          const tag = interaction.user.tag;
          const { start, end } =
            type === CHECKLIST_TYPES.DAILY ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

          // Find checklist
          const checklist = await ChecklistSchema.findOne({
            ownerName: tag,
            type: type ?? CHECKLIST_TYPES.DAILY,
            createdAt: { $gte: start, $lte: end },
          }).populate("items");

          if (!checklist) {
            return interaction.reply({
              content: "❌ Checklist not found.",
              flags: DISCORD_FLAGS.EPHEMERAL,
            });
          }

          // Create task
          const task = await TaskSchema.create({
            checklistId: checklist._id,
            title: taskName,
            status: enumData.TaskStatusType.TODO.code,
          });

          // @ts-ignore
          checklist.items.push(task);
          await checklist.save();

          // Rebuild embed
          const doneCount = countDoneTasks(checklist.items);
          const progressString = `✅ ${doneCount}/${checklist.items.length} completed`;

          const embed = new EmbedBuilder()
            .setTitle(`${checklist.title} (${checklist.type ?? CHECKLIST_TYPES.DAILY})`)
            .setAuthor({
              name: interaction.user.tag,
              iconURL: interaction.user.avatarURL(),
            })

            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(
              checklist.items && checklist.items.length > 0
                ? // @ts-ignore
                  checklist.items
                    .map(
                      (task, idx) =>
                        `**${idx + 1}.** ${task.title} — \`${TASK_STATUS_UI[task.status]?.name ?? task.status}\``,
                    )
                    .join("\n")
                : `✨ No tasks yet. Click **"📋 Add"** button to add one!`,
            )
            .setFooter({ text: `${progressString}` })
            .setTimestamp();

          // Update old checklist message if it exists
          if (checklist.lastMessageId && checklist.channelId) {
            try {
              const channel = await client.channels.fetch(
                interaction.channelId,
              );
              // Fetch the original message
              const message = await channel.messages.fetch(
                checklist.lastMessageId,
              );

              // Edit only the embeds, keep existing components
              await message.edit({
                embeds: [embed],
                components: message.components, // reuse old components
              });
              checklist.channelId = channel.id;
              checklist.lastMessageId = message.id;
              await checklist.save();
            } catch (err) {
              console.error("❌ Failed to update old checklist message:", err);
            }
          }

          await interaction.reply({
            content: `✅ Task **${taskName}** added to checklist **${checklist.title}**!`,
            flags: DISCORD_FLAGS.EPHEMERAL,
          });
          break;
        }
        case `edit-task-modal:${type}`: //edit task
        {
          const taskInputEditValue =
            interaction.fields.getTextInputValue("input-edit-task") ?? "";
          const selectedTaskId =
            interaction.fields.getStringSelectValues("select-edit-task")[0];
          const selectStatusValue =
            interaction.fields.getStringSelectValues(
              "select-edit-task-status",
            )[0] ?? "";

          const task = await TaskSchema.findById(selectedTaskId);
          let taskOldName = task.title;
          task.status = selectStatusValue;
          task.title =
            taskInputEditValue === "" ? task.title : taskInputEditValue;
          await task.save();

          // Rebuild embed
          const type = interaction.customId.split(":")[1];
          const tag = interaction.user.tag;
          const { start, end } =
            type === CHECKLIST_TYPES.DAILY ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

          // Find checklist
          const checklist = await ChecklistSchema.findOne({
            ownerName: tag,
            type: type ?? CHECKLIST_TYPES.DAILY,
            createdAt: { $gte: start, $lte: end },
          }).populate("items");
          if (!checklist) {
            return interaction.reply({
              content: "❌ Checklist not found.",
              flags: DISCORD_FLAGS.EPHEMERAL,
            });
          }

          const doneCount = countDoneTasks(checklist.items);
          const progressString = `✅ ${doneCount}/${checklist.items.length} completed`;

          const embed = new EmbedBuilder()
            .setTitle(`${checklist.title} (${checklist.type ?? CHECKLIST_TYPES.DAILY})`)
            .setAuthor({
              name: interaction.user.tag,
              iconURL: interaction.user.avatarURL(),
            })
            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(
              checklist.items && checklist.items.length > 0
                ? // @ts-ignore
                  checklist.items
                    .map(
                      (task, idx) =>
                        `**${idx + 1}.** ${task.title} — \`${TASK_STATUS_UI[task.status]?.name ?? task.status}\``,
                    )
                    .join("\n")
                : `✨ No tasks yet. Click **"📋 Add"** button to add one!`,
            )
            .setFooter({ text: `${progressString}` })
            .setTimestamp();

          // Update old checklist message if it exists
          if (checklist.lastMessageId && checklist.channelId) {
            try {
              const channel = await client.channels.fetch(
                interaction.channelId,
              );
              // Fetch the original message
              const message = await channel.messages.fetch(
                checklist.lastMessageId,
              );

              // Edit only the embeds, keep existing components
              await message.edit({
                embeds: [embed],
                components: message.components, // reuse old components
              });
              checklist.channelId = channel.id;
              checklist.lastMessageId = message.id;
              await checklist.save();
            } catch (err) {
              console.error("❌ Failed to update old checklist message:", err);
            }
          }

          await interaction.reply({
            content: `✅ Task **${taskOldName}** has updated to: **${task.title}** — \`${task.status}\``,
            flags: DISCORD_FLAGS.EPHEMERAL,
          });
          break;
        }
        case `remove-task-modal:${type}`: {
          const selectedTaskId =
            interaction.fields.getStringSelectValues("select-remove-task")[0];
          const task = await TaskSchema.findById(selectedTaskId);
          let taskTitle = task.title;

          await task.deleteOne();

          // Rebuild embed
          const type = interaction.customId.split(":")[1];
          const tag = interaction.user.tag;
          const { start, end } =
            type === CHECKLIST_TYPES.DAILY ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

          // Find checklist
          const checklist = await ChecklistSchema.findOne({
            ownerName: tag,
            type: type ?? CHECKLIST_TYPES.DAILY,
            createdAt: { $gte: start, $lte: end },
          }).populate("items");
          if (!checklist) {
            return interaction.reply({
              content: "❌ Checklist not found.",
              flags: DISCORD_FLAGS.EPHEMERAL,
            });
          }

          checklist.items = checklist.items.filter(
            (itemId) => itemId._id.toString() !== selectedTaskId,
          );

          await checklist.save();

          const doneCount = countDoneTasks(checklist.items);
          const progressString = `✅ ${doneCount}/${checklist.items.length} completed`;

          const embed = new EmbedBuilder()
            .setTitle(`${checklist.title} (${checklist.type ?? CHECKLIST_TYPES.DAILY})`)
            .setAuthor({
              name: interaction.user.tag,
              iconURL: interaction.user.avatarURL(),
            })
            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(
              checklist.items && checklist.items.length > 0
                ? // @ts-ignore
                  checklist.items
                    .map(
                      (task, idx) =>
                        `**${idx + 1}.** ${task.title} — \`${TASK_STATUS_UI[task.status]?.name ?? task.status}\``,
                    )
                    .join("\n")
                : `✨ No tasks yet. Click **"📋 Add"** button to add one!`,
            )
            .setFooter({ text: `${progressString}` })
            .setTimestamp();

          // Update old checklist message if it exists
          if (checklist.lastMessageId && checklist.channelId) {
            try {
              const channel = await client.channels.fetch(
                interaction.channelId,
              );
              // Fetch the original message
              const message = await channel.messages.fetch(
                checklist.lastMessageId,
              );

              // Edit only the embeds, keep existing components
              await message.edit({
                embeds: [embed],
                components: message.components, // reuse old components
              });
              checklist.channelId = channel.id;
              checklist.lastMessageId = message.id;
              await checklist.save();
            } catch (err) {
              console.error("❌ Failed to update old checklist message:", err);
            }
          }

          await interaction.reply({
            content: `✅ Task **${taskTitle}** has been removed.`,
            flags: DISCORD_FLAGS.EPHEMERAL,
          });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error(err);
    }
  }
  if (interaction.isButton()) {
    if (await daily.handleDailyButton(interaction, client)) return;

    if (interaction.customId.startsWith("btn-add-task")) {
      const type = interaction.customId.split(":")[1];
      const tag = interaction.user.tag;
      const { start, end } =
        type === CHECKLIST_TYPES.DAILY ? getTodayRangeUTC(7) : getWeekRangeUTC(7);
      // Find checklist
      const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        type: type ?? CHECKLIST_TYPES.DAILY,
        createdAt: { $gte: start, $lte: end },
      }).populate("items");
      if (!checklist) {
        return interaction.reply({
          content: "❌ Checklist not found.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }
      const addModal = await addTaskModal.build(type);
      await interaction.showModal(addModal);
      return;
    }
    if (interaction.customId.startsWith("btn-edit-task")) {
      const type = interaction.customId.split(":")[1];
      const tag = interaction.user.tag;
      const { start, end } =
        type === CHECKLIST_TYPES.DAILY ? getTodayRangeUTC(7) : getWeekRangeUTC(7);
      // Find checklist
      const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        type: type ?? CHECKLIST_TYPES.DAILY,
        createdAt: { $gte: start, $lte: end },
      }).populate("items");
      if (!checklist) {
        return interaction.reply({
          content: "❌ Checklist not found.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }
      if (!checklist.items || checklist.items.length === 0) {
        return interaction.reply({
          content: "⚠️ Please add some task!",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }
      const editModal = await editTaskModal.build(checklist.items, type);
      await interaction.showModal(editModal);
      
      return;
    }
    if (interaction.customId.startsWith("btn-delete-task")) {
      const type = interaction.customId.split(":")[1];
      const tag = interaction.user.tag;
      const { start, end } =
        type === CHECKLIST_TYPES.DAILY ? getTodayRangeUTC(7) : getWeekRangeUTC(7);
      // Find checklist
      const checklist = await ChecklistSchema.findOne({
        ownerName: tag,
        type: type ?? CHECKLIST_TYPES.DAILY,
        createdAt: { $gte: start, $lte: end },
      }).populate("items");
      if (!checklist) {
        return interaction.reply({
          content: "❌ Checklist not found.",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }
      if (!checklist.items || checklist.items.length === 0) {
        return interaction.reply({
          content: "⚠️ Please add some task!",
          flags: DISCORD_FLAGS.EPHEMERAL,
        });
      }
      const removeModal = await removeTaskModal.build(checklist.items, type);
      await interaction.showModal(removeModal);
      return;
    }
  }
};
