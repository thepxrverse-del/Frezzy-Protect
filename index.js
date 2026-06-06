const { Client, GatewayIntentBits, EmbedBuilder, Events, ActivityType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Frezzy Protect Aktif!'));
app.listen(port, () => console.log(`Bot ${port} portunda yayında!`));

// Token'ı buraya yenilenmiş haliyle yazın
const WELCOME_CHANNEL_ID = '1506046438834966689';
const LOG_CHANNEL_ID = '1506282577185607710';
const SUSPICIOUS_ROLE_ID = '1506279327841652746';
const NORMAL_ROLE_ID = '1506068587436179496';
const VOICE_CHANNEL_ID = '1506252445746069564';

// Sayı emojileri
const numberEmojis = {
  0: '<:0:1506268159563534367>',
  1: '<:1:1506267905174798498>',
  2: '<:2:1506267942650904756>',
  3: '<:3:1506267974858707014>',
  4: '<:4:1506268002663006270>',
  5: '<:5:1506268035550544115>',
  6: '<:6:1506268064637784224>',
  7: '<:7:1506268098569699418>',
  8: '<:8:1506268117586808912>',
  9: '<:9:1506268142182338641>'
};

function toEmojiNumber(num) {
  return num.toString().split('').map(d => numberEmojis[d] || d).join('');
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ ${client.user.tag} giriş yaptı`);

  // Durum ayarla
  client.user.setPresence({
    activities: [{ 
      name: 'sizler için uğraşıyor', 
      type: ActivityType.Streaming, 
      url: 'https://www.twitch.tv/discord' 
    }],
    status: 'online',
  });

  // Ses kanalına katıl
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

  // Log kanalına mesaj gönder
  const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
  if (logChannel) {
    await logChannel.send('🚀 **Bot aktif!** Sizler için uğraşıyor olacak...');
  } else {
    console.error('Log kanalı bulunamadı:', LOG_CHANNEL_ID);
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  const guild = member.guild;
  const welcomeChannel = guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!welcomeChannel) return console.error('Hoşgeldin kanalı yok');

  const createdAt = member.user.createdAt;
  const now = new Date();
  const accountAgeDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  const accountAgeYears = Math.floor(accountAgeDays / 365);
  const accountAgeMonths = Math.floor((accountAgeDays % 365) / 30);
  let accountAgeText = '';
  if (accountAgeYears > 0) accountAgeText = `${accountAgeYears} yıl ${accountAgeMonths} ay`;
  else if (accountAgeMonths > 0) accountAgeText = `${accountAgeMonths} ay`;
  else accountAgeText = `${accountAgeDays} gün`;

  const joinedAt = member.joinedAt;
  const joinMinutes = Math.floor((now - joinedAt) / (1000 * 60));
  let joinText = '';
  if (joinMinutes < 1) joinText = 'az önce';
  else if (joinMinutes < 60) joinText = `${joinMinutes} dakika önce`;
  else if (joinMinutes < 1440) joinText = `${Math.floor(joinMinutes / 60)} saat önce`;
  else joinText = `${Math.floor(joinMinutes / 1440)} gün önce`;

  const memberCount = guild.memberCount;
  const memberCountEmoji = toEmojiNumber(memberCount);

  const isSuspicious = accountAgeDays < 7;
  const roleToGive = isSuspicious ? SUSPICIOUS_ROLE_ID : NORMAL_ROLE_ID;

  try {
    await member.roles.add(roleToGive);
    console.log(`${member.user.tag} -> ${isSuspicious ? 'Şüpheli' : 'Normal'} rolü verildi.`);
  } catch (err) {
    console.error('Rol atanamadı:', err);
  }

  const embed = new EmbedBuilder()
    .setColor(isSuspicious ? 0xFF0000 : 0x00FF00)
    .setTitle('🎉 Yeni Katılım!')
    .setDescription(`
      Selamlar ${member}!
      Seninle birlikte artık **${memberCountEmoji}** kişiyiz!

      **Hesap Oluşturulma:** ${createdAt.toLocaleDateString('tr-TR')} (${accountAgeText} önce)
      **Sunucuya Katılma:** ${joinText}
      **Kullanıcı ID:** \`${member.id}\`
      **Hesap Durumu:** ${isSuspicious ? '⚠️ Şüpheli Hesap' : '✅ Normal Hesap'}
    `)
    .setFooter({ text: 'Frezzy Protect', iconURL: guild.iconURL() })
    .setTimestamp();

  await welcomeChannel.send({ embeds: [embed] });
});

client.login(TOKEN);
