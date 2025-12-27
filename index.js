const { 
    Client, 
    GatewayIntentBits, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType 
} = require('discord.js');
require('dotenv').config();
const port = process.env.PORT || 3000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// --- CONFIGURATION ---

client.once('ready', () => {
    console.log(`✅ Bot Esport connecté : ${client.user.tag}`);
});

// --- MODULE TICKETS & SETUP ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === `${PREFIX}setup-ticket`) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const embed = new EmbedBuilder()
            .setTitle('🎫 Support & Recrutement')
            .setDescription('Sélectionnez la catégorie ci-dessous pour ouvrir un ticket.')
            .setColor('#2b2d31')
            .setFooter({ text: 'Team Esport - Système de Gestion' });

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select-ticket')
                .setPlaceholder('🔽 Choisis un motif de ticket')
                .addOptions([
                    { label: 'Recrutements Modération', value: 'Modération', emoji: '🎫' },
                    { label: 'Recrutements Joueur', value: 'Joueur', emoji: '🎮' },
                    { label: 'Recrutements Studio', value: 'Studio', emoji: '🎨' },
                    { label: 'Partenariats', value: 'Partenariats', emoji: '🤝' },
                ]),
        );

        await message.channel.send({ embeds: [embed], components: [menu] });
    }
});

// --- GESTION DES INTERACTIONS ---
client.on('interactionCreate', async (interaction) => {
    
    // 1. OUVERTURE DU TICKET (Via Menu)
    if (interaction.isStringSelectMenu() && interaction.customId === 'select-ticket') {
        const type = interaction.values[0];
        
        const channel = await interaction.guild.channels.create({
            name: `ticket-${type}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
            ],
        });

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`👋 Ticket ${type}`)
            .setDescription(`Bonjour <@${interaction.user.id}>, l'équipe **${type}** va t'aider d'ici peu.\n\n**Action requise :**\nDécris ton projet ou envoie ton CV/Portfolio ci-dessous.`)
            .setColor('#5865F2')
            .setTimestamp();

        const closeBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close-ticket').setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [welcomeEmbed], components: [closeBtn] });
        await interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });
    }

    // 2. FERMETURE DU TICKET (Via Bouton)
    if (interaction.isButton() && interaction.customId === 'close-ticket') {
        await interaction.reply('⚠️ Fermeture du ticket dans 5 secondes...');
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    // 3. COMMANDES SLASH (Logique pour 30 commandes)
    if (interaction.isChatInputCommand()) {
        const { commandName, options, guild, channel, member } = interaction;

        // Exemple de commandes clés
        switch (commandName) {
            case 'ban':
                if (!member.permissions.has(PermissionFlagsBits.BanMembers)) return;
                await guild.members.ban(options.getUser('cible'));
                await interaction.reply('🔨 Utilisateur banni.');
                break;
                
            case 'clear':
                if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
                const count = options.getInteger('nombre');
                await channel.bulkDelete(count);
                await interaction.reply({ content: `🧹 ${count} messages effacés.`, ephemeral: true });
                break;

            case 'scrim':
                const scrimEmbed = new EmbedBuilder()
                    .setTitle('🎮 MATCH DE TEST (SCRIM)')
                    .addFields(
                        { name: 'Jeu', value: options.getString('jeu'), inline: true },
                        { name: 'Heure', value: options.getString('heure'), inline: true }
                    )
                    .setColor('#FF0000');
                await interaction.reply({ embeds: [scrimEmbed] });
                break;

            // Ajoute ici les autres cas (kick, lock, warn, etc.)
        }
    }
});

client.login(TOKEN);
console.log('Token chargé :', TOKEN ? '✅ OUI' : '❌ NON');
