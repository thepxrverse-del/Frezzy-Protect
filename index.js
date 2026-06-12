require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    AttachmentBuilder
} = require('discord.js');

const { createCanvas, loadImage } = require('canvas');
const express = require('express');

// --- EXPRESS SUNUCUSU ---
const app = express();
const port = 3000;
app.get('/', (req, res) => res.send('Hoş Geldin Botu Aktif!'));
app.listen(port, () => console.log(`🌍 Sunucu ${port} portunda yayında!`));

  client.user.setPresence({
    activities: [{ 
      name: 'sizler için uğraşıyor', 
      type: ActivityType.Streaming, 
      url: 'https://www.twitch.tv/discord' 
    }],
    status: 'online',
  });


// --- GÜVENLİK KONTROLÜ ---
if (!process.env.TOKEN) {
    console.error("🚨 KRİTİK HATA: .env dosyanızda TOKEN bulunamadı!");
    process.exit(1);
}

// ============================================
// ⚙️ AYARLAR VE EMOJİLER
// ============================================
const VOICE_CHANNEL_ID = '1506252445746069564';
const WELCOME_CHANNEL_ID = '1506046438834966689'; // Sunucudaki kanal ID'niz
const UNREGISTERED_ROLE_ID = '1506068587436179496'; // Kayıtsız üye rolü
const SUSPICIOUS_ROLE_ID = '1506279327841652746';     // Şüpheli rolü

// Kendi sunucu emojilerini eklemek için '<:isim:id>' veya hareketliyse '<a:isim:id>' formatında yaz.
const EMOJI_BELL = '🔔'; 
const EMOJI_USER = '👤';
const EMOJI_CALENDAR = '📅';
const EMOJI_CLOCK = '⏰';
const EMOJI_BOOK = '📖';
const EMOJI_ALERT = '🚨';

// --- BOT KURULUMU ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers 
    ]
});

client.once('ready', () => { 
    console.log(`🤖 ${client.user.username} Hoş Geldin Botu hatasız şekilde aktif!`);
});

  const voiceChannel = client.channels.cache.get(VOICE_CHANNEL_ID);
  if (voiceChannel && voiceChannel.isVoiceBased()) {
    joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    console.log(`🔊 Ses kanalına katılındı: ${voiceChannel.name}`);
  } else {
    console.error(`Ses kanalı bulunamadı veya geçersiz: ${VOICE_CHANNEL_ID}`);
  }

// ============================================
// 🎨 CANVAS ÇİZİM FONKSİYONU 1: KANAL İÇİN (MERKEZLİ)
// ============================================
async function createChannelImage(member, bannerUrl) {
    const canvas = createCanvas(1000, 500); 
    const ctx = canvas.getContext('2d');
    const background = await loadImage(bannerUrl);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const avatarSize = 170; 
    const avatarY = 90; 

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarUrl);
    ctx.drawImage(avatar, centerX - avatarSize / 2, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.textAlign = 'center'; 
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 55px sans-serif'; 
    ctx.fillText(member.user.username, centerX, avatarY + avatarSize + 60);

    ctx.fillStyle = '#D3D3D3'; 
    ctx.font = '28px sans-serif';
    ctx.fillText('Sunucumuza hoşgeldin, kuralları', centerX, avatarY + avatarSize + 110);
    ctx.fillText('okumayı unutma!', centerX, avatarY + avatarSize + 145);

    return canvas.toBuffer();
}

// ============================================
// 🎨 CANVAS ÇİZİM FONKSİYONU 2: DM İÇİN (SOLA DAYALI)
// ============================================
async function createDmImage(member, bannerUrl, accountDays) {
    const canvas = createCanvas(1000, 420); 
    const ctx = canvas.getContext('2d');
    
    const background = await loadImage(bannerUrl);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const avatarSize = 150;
    const avatarX = 210;
    const avatarY = canvas.height / 2; 

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarUrl);
    ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.strokeStyle = '#A8A1C9'; 
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.textAlign = 'left';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(member.user.username, 418, 225);

    ctx.fillStyle = '#B5AEC4';
    ctx.font = '20px sans-serif';
    ctx.fillText(`${member.guild.name} sunucusuna katıldın.`, 418, 270);

    ctx.fillStyle = '#8A829E';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${member.guild.memberCount}. üye  •  Hesap: ${accountDays} gün  •  ID: ${member.id}`, 418, 315);

    if (member.guild.iconURL()) {
        const serverIconSize = 70;
        const serverIconX = 910;
        const serverIconY = 340;

        ctx.save();
        ctx.beginPath();
        ctx.arc(serverIconX, serverIconY, serverIconSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        const serverIconUrl = member.guild.iconURL({ extension: 'png', size: 128 });
        const serverIcon = await loadImage(serverIconUrl);
        ctx.drawImage(serverIcon, serverIconX - serverIconSize / 2, serverIconY - serverIconSize / 2, serverIconSize, serverIconSize);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(serverIconX, serverIconY, serverIconSize / 2, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    return canvas.toBuffer();
}

// ============================================
// SUNUCUYA BİRİ KATILDIĞINDA
// ============================================
// ... (Başlangıçtaki importlar aynı kalmalı)

client.on('guildMemberAdd', async (member) => {
    try {
        // --- 1. ROL ATAMA İŞLEMLERİ ---
        const roleUnregistered = member.guild.roles.cache.get(UNREGISTERED_ROLE_ID);
        const roleSuspicious = member.guild.roles.cache.get(SUSPICIOUS_ROLE_ID);
        const accountDays = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
        const isSuspicious = accountDays < 7;
        const securityStatus = isSuspicious ? 'Şüpheli ❌' : 'Güvenli ✓';
        const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);

        if (roleUnregistered) await member.roles.add(roleUnregistered).catch(console.error);
        if (isSuspicious && roleSuspicious) await member.roles.add(roleSuspicious).catch(console.error);

        // --- 2. KANALA GÖNDERİM (CONTAINERSİZ) ---
        const channelBannerUrl = 'https://cdn.discordapp.com/attachments/1514986989349244958/1514990549495578675/Hosgeldin_Banner_1.png?ex=6a2d6066&is=6a2c0ee6&hm=49234d8b110d9278ca9ba4b93f98fa9210aa8c26edfc5f410e592691cd590936&';
        const channelImageBuffer = await createChannelImage(member, channelBannerUrl);
        const channelAttachment = new AttachmentBuilder(channelImageBuffer, { name: 'channel-welcome.png' });

        const targetChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
        if (targetChannel) {
            await targetChannel.send({ 
                content: `<a:merhaba:1515117452118196427>  ${member} Sunucuya Katıldı! Seninle birlikte **${member.guild.memberCount}** olduk!`,
                files: [channelAttachment] 
            });
        }

        // --- 3. DM GÖNDERİMİ (MAVİ ŞERİTLİ CONTAINER) ---
        const dmBannerUrl = 'https://cdn.discordapp.com/attachments/1514986989349244958/1514993065176338544/Adsz_tasarm_2.png?ex=6a2d62bd&is=6a2c113d&hm=083ab386153e5187fcc3afef1216cc93b1f60ca487c7d67366472dfc79e9539b&';
        const dmImageBuffer = await createDmImage(member, dmBannerUrl, accountDays);
        const dmAttachment = new AttachmentBuilder(dmImageBuffer, { name: 'dm-welcome.png' });

        const welcomeText = new TextDisplayBuilder().setContent(
            `<a:duyuru:1515117280462241852> **Kullanıcı:** ${member} - \`${member.user.username}\`\n` +
            `<:kullanici:1515117313563820215> **Kullanıcı ID:** \`${member.id}\`\n` +
            `<a:takvim:1515117480765296842> **Hesap oluşturma tarihi:** <t:${createdTimestamp}:F>\n` +
            `<a:saat:1515117369314246807> **Sunucuya giriş sırası:** \`${member.guild.memberCount}/${member.guild.memberCount}\`\n` +
            `<:kitap:1515117389522665602> **Hesap güvenliği :** \`${securityStatus}\`\n` +
            `<a:uyari:1515117409428570143> - Merhabalar, sunucumuza hoşgeldiniz! Sunucumuza katıldığın için üzerine **Üye** rolünü verdim!`
        );

        const serverLogoUrl = member.guild.iconURL({ dynamic: true, size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

        const profileThumbnail = new ThumbnailBuilder({
            media: { url: serverLogoUrl },
        });

        const dmContainer = new ContainerBuilder()
            .addSectionComponents(new SectionBuilder().addTextDisplayComponents(welcomeText).setThumbnailAccessory(profileThumbnail))
            .addMediaGalleryComponents(new MediaGalleryBuilder().addItems([{ media: { url: 'attachment://dm-welcome.png' } }]))
            .addSeparatorComponents(new SeparatorBuilder())
            .setAccentColor(0x0099FF); 

        await member.send({
            flags: MessageFlags.IsComponentsV2,
            components: [dmContainer],
            files: [dmAttachment]
        }).catch(() => console.log(`💬 ${member.user.username} DM kapalı.`));

    } catch (error) {
        console.error("🚨 İşlem hatası:", error);
    }
});

client.login(process.env.TOKEN);
