// --- Render Web Server Setup ---
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`Dummy server listening on port ${port}!`));
// -------------------------------

const mineflayer = require('mineflayer');
const config = require('./config.json');

const bot = mineflayer.createBot({
  host: config.serverHost,
  port: config.serverPort,
  username: config.botUsername,
  auth: 'offline',
  version: '26.3', // Set to your specified version
  viewDistance: config.botChunk
});

let movementPhase = 0;
const STEP_INTERVAL = 1500;
const STEP_SPEED    = 1;
const JUMP_DURATION = 500;

bot.on('spawn', () => {
  // Teleport immediately to specific coordinates upon spawning
  bot.chat('/tp -349 66 -500');

  setTimeout(() => {
    bot.setControlState('sneak', true);
    console.log(`✅ ${config.botUsername} is Ready!`);
  }, 3000);

  setTimeout(movementCycle, STEP_INTERVAL);
});

function movementCycle() {
  if (!bot.entity) return;

  switch (movementPhase) {
    case 0:
      bot.setControlState('forward', true);
      bot.setControlState('back', false);
      bot.setControlState('jump', false);
      break;
    case 1:
      bot.setControlState('forward', false);
      bot.setControlState('back', true);
      bot.setControlState('jump', false);
      break;
    case 2:
      bot.setControlState('forward', false);
      bot.setControlState('back', false);
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, JUMP_DURATION);
      break;
    case 3:
      bot.setControlState('forward', false);
      bot.setControlState('back', false);
      bot.setControlState('jump', false);
      break;
  }

  movementPhase = (movementPhase + 1) % 4;

  setTimeout(movementCycle, STEP_INTERVAL);
}

bot.on('error', (err) => {
  console.error('⚠️ Error:', err);
});
bot.on('end', () => {
  console.log('⛔ Bot Disconnected!');
});
