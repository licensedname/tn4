// bot-server.js
// Example combined Express server + Discord bot that supports OAuth login
// Flow:
// 1. User clicks /auth/discord -> redirected to Discord OAuth2 authorize
// 2. Discord redirects back to /auth/discord/callback with code
// 3. Server exchanges code for token, GET /users/@me to obtain user id
// 4. Bot (discord.js) opens DM to user and asks the question
// 5. When the user replies, the bot checks answer and sends invite if correct

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/discord/callback`;
const BOT_TOKEN = process.env.BOT_TOKEN;
const INVITE_URL = process.env.INVITE_URL || 'https://discord.gg/YOURINVITE';

if(!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !BOT_TOKEN){
  console.error('Missing DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, or BOT_TOKEN in .env');
  process.exit(1);
}

// Start Discord bot client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log('Discord bot ready as', client.user.tag);
});

// Handle DMs: check for answers
client.on('messageCreate', async (message) => {
  if(message.author.bot) return;
  if(message.channel.type !== 1 && message.channel.type !== 'DM') return; // DM only
  const text = (message.content || '').trim().toLowerCase();
  if(text.includes('keyframe')){
    await message.reply(`Correct — here's the invite: ${INVITE_URL}`);
  } else if(text.includes('pose')){
    await message.reply("Nice try — you can still join: " + INVITE_URL);
  } else {
    await message.reply('Please answer either "Keyframe" or "Pose".');
  }
});

client.login(BOT_TOKEN).catch(err => { console.error('Failed to login bot:', err); process.exit(1); });

// Parse JSON bodies
app.use(express.json());

// Serve static files (index.html etc) from project root
app.use(express.static(path.join(__dirname, '..')));

// API: add user by Discord ID and return basic profile info
app.post('/api/add-user', async (req, res) => {
  const { id } = req.body || {};
  if(!id) return res.status(400).json({ error: 'missing id' });
  try{
    const user = await client.users.fetch(id, { force: true });
    const avatar = user.displayAvatarURL({ format: 'png', size: 256 });
    return res.json({ id: user.id, username: user.username + (user.discriminator ? ('#' + user.discriminator) : ''), avatar });
  }catch(err){
    console.error('Failed to fetch user', id, err);
    return res.status(500).json({ error: 'failed to fetch user' });
  }
});

// Start OAuth flow
app.get('/auth/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify'
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// OAuth callback
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if(!code) return res.status(400).send('Missing code');

  try{
    // Exchange code for token
    const params = new URLSearchParams();
    params.append('client_id', DISCORD_CLIENT_ID);
    params.append('client_secret', DISCORD_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'}, body: params
    });
    const token = await tokenRes.json();
    if(token.error) throw token;

    // Get user info
    const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token.access_token}` } });
    const user = await userRes.json();

    // Use bot to DM the user
    try{
      const discordUser = await client.users.fetch(user.id, { force: true });
      await discordUser.send('Which came first — the KeyFrame or the Pose? Reply with Keyframe or Pose.');
      res.send(`Sent DM to ${user.username}. Please reply in Discord.`);
    }catch(err){
      console.error('Failed to DM user:', err);
      res.status(500).send('Failed to DM user — they may have DMs disabled from server members.');
    }

  }catch(err){
    console.error('OAuth error', err);
    res.status(500).send('OAuth error — check server logs');
  }
});

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
