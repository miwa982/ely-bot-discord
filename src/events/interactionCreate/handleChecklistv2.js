import enumData from "../../enum/enumData.js";
import addTaskModal from "../../commands/Modals/addTaskModal.js";
import editTaskModal from "../../commands/Modals/editTaskModal.js";
import { getTodayRangeUTC, getWeekRangeUTC } from "../../utils/date.js";
import { EmbedBuilder } from "discord.js";
import ChecklistSchema from "../../db/Checklist/checklistSchema.js"
import TaskSchema from "../../db/Checklist/taskSchema.js"
import removeTaskModal from "../../commands/Modals/removeTaskModal.js";
import settingChecklistModal from "../../commands/Modals/settingChecklistModal.js";

const countDoneTasks = (items) => {
    return items.filter(item => item.status === enumData.TaskStatusType.DONE.code).length;
}

export default async (interaction, client) => {

    if (interaction.isModalSubmit()) {
        const type = interaction.customId.split(":")[1];
        try {
            switch (interaction.customId) {
                case `add-task-modal:${type}`:
                    //add task
                    {
                        const taskInputValue = interaction.fields.getTextInputValue('input-task') ?? '';
                        const selectValue = interaction.fields.getStringSelectValues('select-task') ?? '';
                        if (taskInputValue && selectValue[0]) {
                            return interaction.reply({
                                content: "❌ You must either type a new task OR select a suggestion!",
                                flags: 64 // ephemeral
                            });
                        }
                        if (!taskInputValue && !selectValue[0]) {
                            return interaction.reply({
                                content: "❌ You must either type a new task OR select a suggestion!",
                                flags: 64
                            });
                        }
                        const taskName = taskInputValue || selectValue[0];
                        const type = interaction.customId.split(":")[1];
                        const tag = interaction.user.tag;
                        const { start, end } = type === 'daily' ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

                        // Find checklist
                        const checklist = await ChecklistSchema.findOne({
                            ownerName: tag,
                            type: type ?? 'daily',
                            createdAt: { $gte: start, $lte: end }
                        }).populate("items");

                        if (!checklist) {
                            return interaction.reply({ content: "❌ Checklist not found.", flags: 64 });
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
                        const progressString = `✅ ${doneCount}/${checklist.items.length} completed`

                        const embed = new EmbedBuilder()
                            .setTitle(`${checklist.title} (${checklist.type ?? 'daily'})`)
                            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })

                            .setColor(0xec82b0)
                            .setDescription(
                                checklist.items && checklist.items.length > 0 ?
                                    // @ts-ignore
                                    checklist.items.map((task, idx) => `**${idx + 1}.** ${task.title} — \`${enumData.TaskStatusTypeUI[task.status]?.name}\``).join("\n")
                                    : `✨ No tasks yet. Click **"📋 Add"** button to add one!`
                            )
                            .setFooter({ text: `${progressString}` })
                            .setTimestamp();

                        // Update old checklist message if it exists
                        if (checklist.lastMessageId && checklist.channelId) {
                            try {
                                const channel = await client.channels.fetch(interaction.channelId);
                                // Fetch the original message
                                const message = await channel.messages.fetch(checklist.lastMessageId);

                                // Edit only the embeds, keep existing components
                                await message.edit({
                                    embeds: [embed],
                                    components: message.components // reuse old components
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
                            flags: 64
                        });
                        break;
                    }
                case `edit-task-modal:${type}`:
                    //edit task
                    {
                        const taskInputEditValue = interaction.fields.getTextInputValue('input-edit-task') ?? '';
                        const selectedTaskId = interaction.fields.getStringSelectValues('select-edit-task')[0];
                        const selectStatusValue = interaction.fields.getStringSelectValues('select-edit-task-status')[0] ?? '';

                        const task = await TaskSchema.findById(selectedTaskId)
                        let taskOldName = task.title
                        task.status = selectStatusValue
                        task.title = taskInputEditValue === '' ? task.title : taskInputEditValue
                        await task.save()

                        // Rebuild embed 
                        const type = interaction.customId.split(":")[1];
                        const tag = interaction.user.tag;
                        const { start, end } = type === 'daily' ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

                        // Find checklist
                        const checklist = await ChecklistSchema.findOne({
                            ownerName: tag,
                            type: type ?? 'daily',
                            createdAt: { $gte: start, $lte: end }
                        }).populate("items");
                        if (!checklist) {
                            return interaction.reply({ content: "❌ Checklist not found.", flags: 64 });
                        }

                        const doneCount = countDoneTasks(checklist.items);
                        const progressString = `✅ ${doneCount}/${checklist.items.length} completed`

                        const embed = new EmbedBuilder()
                            .setTitle(`${checklist.title} (${checklist.type ?? 'daily'})`)
                            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
                            .setColor(0xec82b0)
                            .setDescription(
                                checklist.items && checklist.items.length > 0 ?
                                    // @ts-ignore
                                    checklist.items.map((task, idx) => `**${idx + 1}.** ${task.title} — \`${enumData.TaskStatusTypeUI[task.status]?.name}\``).join("\n")
                                    : `✨ No tasks yet. Click **"📋 Add"** button to add one!`
                            )
                            .setFooter({ text: `${progressString}` })
                            .setTimestamp();

                        // Update old checklist message if it exists
                        if (checklist.lastMessageId && checklist.channelId) {
                            try {
                                const channel = await client.channels.fetch(interaction.channelId);
                                // Fetch the original message
                                const message = await channel.messages.fetch(checklist.lastMessageId);

                                // Edit only the embeds, keep existing components
                                await message.edit({
                                    embeds: [embed],
                                    components: message.components // reuse old components
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
                            flags: 64
                        });
                        break;
                    }
                case `remove-task-modal:${type}`:
                    {
                        const selectedTaskId = interaction.fields.getStringSelectValues('select-remove-task')[0];
                        const task = await TaskSchema.findById(selectedTaskId)
                        let taskTitle = task.title

                        await task.deleteOne()

                        // Rebuild embed 
                        const type = interaction.customId.split(":")[1];
                        const tag = interaction.user.tag;
                        const { start, end } = type === 'daily' ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

                        // Find checklist
                        const checklist = await ChecklistSchema.findOne({
                            ownerName: tag,
                            type: type ?? 'daily',
                            createdAt: { $gte: start, $lte: end }
                        }).populate("items");
                        if (!checklist) {
                            return interaction.reply({ content: "❌ Checklist not found.", flags: 64 });
                        }

                        checklist.items = checklist.items.filter(itemId =>
                            itemId._id.toString() !== selectedTaskId
                        );

                        await checklist.save();

                        const doneCount = countDoneTasks(checklist.items);
                        const progressString = `✅ ${doneCount}/${checklist.items.length} completed`

                        const embed = new EmbedBuilder()
                            .setTitle(`${checklist.title} (${checklist.type ?? 'daily'})`)
                            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
                            .setColor(0xec82b0)
                            .setDescription(
                                checklist.items && checklist.items.length > 0 ?
                                    // @ts-ignore
                                    checklist.items.map((task, idx) => `**${idx + 1}.** ${task.title} — \`${enumData.TaskStatusTypeUI[task.status]?.name}\``).join("\n")
                                    : `✨ No tasks yet. Click **"📋 Add"** button to add one!`
                            )
                            .setFooter({ text: `${progressString}` })
                            .setTimestamp();

                        // Update old checklist message if it exists
                        if (checklist.lastMessageId && checklist.channelId) {
                            try {
                                const channel = await client.channels.fetch(interaction.channelId);
                                // Fetch the original message
                                const message = await channel.messages.fetch(checklist.lastMessageId);

                                // Edit only the embeds, keep existing components
                                await message.edit({
                                    embeds: [embed],
                                    components: message.components // reuse old components
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
                            flags: 64
                        });
                        break;
                    }
                case `setting-checklist-modal:${type}`:
                    {
                        const selectedStatusCode = interaction.fields.getStringSelectValues('select-checklist-status')[0];

                        const tag = interaction.user.tag;
                        const type = interaction.customId.split(":")[1];
                        const { start, end } = (!type || type === 'daily') ? getTodayRangeUTC(7) : getWeekRangeUTC(7);

                        // Find the checklist for today/week
                        const checklist = await ChecklistSchema.findOne({
                            ownerName: tag,
                            type: type ?? 'daily',
                            createdAt: { $gte: start, $lte: end }
                        }).populate("items");

                        if (!checklist) {
                            const messageCon = type === 'daily' ? 'today' : 'this week';
                            return interaction.reply({
                                content: `⚠️ No checklist found for ${messageCon}. Use \`/checklist create\` first.`,
                                flags: 64
                            });
                        }
                        // Removed logic for setting reset statuses
                        await checklist.save()

                        const doneCount = countDoneTasks(checklist.items);
                        const progressString = `✅ ${doneCount}/${checklist.items.length} completed`

                        const embed = new EmbedBuilder()
                            .setTitle(`${checklist.title} (${checklist.type ?? 'daily'})`)
                            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
                            .setColor(0xec82b0)
                            .setDescription(
                                checklist.items && checklist.items.length > 0 ?
                                    // @ts-ignore
                                    checklist.items.map((task, idx) => `**${idx + 1}.** ${task.title} — \`${enumData.TaskStatusTypeUI[task.status]?.name}\``).join("\n")
                                    : `✨ No tasks yet. Click **"📋 Add"** button to add one!`
                            )
                            .setFooter({ text: `${progressString}` })
                            .setTimestamp();

                        // Update old checklist message if it exists
                        if (checklist.lastMessageId && checklist.channelId) {
                            try {
                                const channel = await client.channels.fetch(interaction.channelId);
                                // Fetch the original message
                                const message = await channel.messages.fetch(checklist.lastMessageId);

                                // Edit only the embeds, keep existing components
                                await message.edit({
                                    embeds: [embed],
                                    components: message.components // reuse old components
                                });
                                checklist.channelId = channel.id;
                                checklist.lastMessageId = message.id;
                                await checklist.save();
                            } catch (err) {
                                console.error("❌ Failed to update old checklist message:", err);
                            }
                        }

                        await interaction.reply({
                            content: `✅ Checklist status has changed to ${selectedStatusCode}.`,
                            flags: 64
                        });
                        break;

                    }
                default:
                    break
            }
        }
        catch (err) {
            console.error(err)
        }
    }
    if (interaction.isButton()) {
        if (interaction.customId.startsWith("btn-add-task")) {
            const type = interaction.customId.split(":")[1];
            const tag = interaction.user.tag;
            const { start, end } = type === 'daily' ? getTodayRangeUTC(7) : getWeekRangeUTC(7);
            // Find checklist
            const checklist = await ChecklistSchema.findOne({
                ownerName: tag,
                type: type ?? 'daily',
                createdAt: { $gte: start, $lte: end }
            }).populate("items");
            if (!checklist) {
                return interaction.reply({ content: "❌ Checklist not found.", flags: 64 });
            }
            const addModal = await addTaskModal.build(type);
            await interaction.showModal(addModal);
            return;
        }
        if (interaction.customId.startsWith('btn-edit-task')) {
            const type = interaction.customId.split(":")[1];
            const tag = interaction.user.tag;
            const { start, end } = type === 'daily' ? getTodayRangeUTC(7) : getWeekRangeUTC(7);
            // Find checklist
            const checklist = await ChecklistSchema.findOne({
                ownerName: tag,
                type: type ?? 'daily',
                createdAt: { $gte: start, $lte: end }
            }).populate("items");
            if (!checklist) {
                return interaction.reply({ content: "❌ Checklist not found.", flags: 64 });
            }
            if (!(checklist.items) || checklist.items.length === 0) {
                return interaction.reply({ content: "⚠️ Please add some task!", flags: 64 });
            }

            const editModal = await editTaskModal.build(checklist.items, type);
            await interaction.showModal(editModal);
            return;
        }
        if (interaction.customId.startsWith('btn-delete-task')) {
            const type = interaction.customId.split(":")[1];
            const tag = interaction.user.tag;
            const { start, end } = type === 'daily' ? getTodayRangeUTC(7) : getWeekRangeUTC(7);
            // Find checklist
            const checklist = await ChecklistSchema.findOne({
                ownerName: tag,
                type: type ?? 'daily',
                createdAt: { $gte: start, $lte: end }
            }).populate("items");
            if (!checklist) {
                return interaction.reply({ content: "❌ Checklist not found.", flags: 64 });
            }
            if (!(checklist.items) || checklist.items.length === 0) {
                return interaction.reply({ content: "⚠️ Please add some task!", flags: 64 });
            }
            const removeModal = await removeTaskModal.build(checklist.items, type);
            await interaction.showModal(removeModal);
            return;
        }
        if (interaction.customId.startsWith('btn-setting-checklist')) {
            const type = interaction.customId.split(":")[1];
            const tag = interaction.user.tag;
            const { start, end } = type === 'daily' ? getTodayRangeUTC(7) : getWeekRangeUTC(7);
            // Find checklist
            const checklist = await ChecklistSchema.findOne({
                ownerName: tag,
                type: type ?? 'daily',
                createdAt: { $gte: start, $lte: end }
            }).populate("items");
            if (!checklist) {
                return interaction.reply({ content: "❌ Checklist not found.", flags: 64 });
            }

            const settingModal = await settingChecklistModal.build(type);
            await interaction.showModal(settingModal);
            return;
        }

    }
}