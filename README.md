Discord Bot + OAuth Example

This example shows how to run a combined Express server and Discord bot that:

- Offers an OAuth2 sign-in flow for Discord via `/auth/discord`.
- Exchanges the OAuth code for an access token and fetches the user's Discord id.
- Uses the bot to open a DM with the user asking: "Which came first — the KeyFrame or the Pose?"
- When the user replies in DM with "Keyframe", the bot sends an invite link.

Security notes
- Never commit `BOT_TOKEN`, `DISCORD_CLIENT_SECRET`, or any secrets to source control.
- For production, host the server on HTTPS and set the OAuth redirect URI accordingly in the Discord Developer Portal.
- The bot requires the `Message Content` intent enabled in the Developer Portal to read DM text.

Setup
1. Create a Discord application and bot in the Developer Portal.
2. Enable the `Message Content Intent` for the bot if you want it to read DM responses.
3. Invite the bot to your server if you want to create server invites from code (or provide a static invite URL).

.env example

DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
BOT_TOKEN=your_bot_token
INVITE_URL=https://discord.gg/yourinvite
PORT=3000
REDIRECT_URI=http://localhost:3000/auth/discord/callback

Run

```bash
npm init -y
npm install express node-fetch discord.js dotenv
node server/bot-server.js
```

Visit `http://localhost:3000/index.html` and click the "SIGN IN" button.

What it does
- The server redirects the visitor to Discord for OAuth2.
- After the user authorizes, the server exchanges the code and fetches the user's id.
- The bot then opens a DM and asks the quiz question.
- The bot listens for DM replies and, on the correct answer, sends the invite link.

Notes
- If a user has DMs from server members disabled, the bot may not be able to DM them; consider asking them to join the bot's server first.
- For improved UX you can show a confirmation page after OAuth, or poll server-side for DM delivery status.
