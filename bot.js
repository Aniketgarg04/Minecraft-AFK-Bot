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
  version: '1.21.1', 
  viewDistance: config.botChunk
});

let movementPhase = 0;
let isSleeping = false; // <--- Tracks if the bot is in bed
const STEP_INTERVAL = 1500;
const STEP_SPEED    = 1;
const JUMP_DURATION = 500;

bot.on('spawn', () => {
  setTimeout(() => {
    bot.setControlState('sneak', true);
    console.log(`✅ ${config.botUsername} is Ready!`);
  }, 3000);

  setTimeout(movementCycle, STEP_INTERVAL);
});

// --- Chat commands for sleeping and waking ---
bot.on('chat', async (username, message) => {
  if (username === bot.username) return; // Ignore its own messages

  if (message === 'sleep') {
    // Look for a bed within 6 blocks
    const bed = bot.findBlock({
      matching: block => bot.isABed(block),
      maxDistance: 6
    });

    if (bed) {
      try {
        isSleeping = true;
        bot.clearControlStates(); // Stop all movement so it can enter the bed
        await bot.sleep(bed);
        bot.chat("Zzz... I am sleeping. Type 'wake' to wake me up.");
      } catch (err) {
        isSleeping = false;
        bot.chat("I can't sleep right now! (Is it night time or raining?)");
      }
    } else {
      bot.chat("I can't find a bed nearby!");
    }
  }

  if (message === 'wake') {
    try {
      await bot.wake();
      isSleeping = false;
      bot.chat("I am awake and moving again!");
    } catch (err) {
      bot.chat("I am not sleeping!");
    }
  }
});
// ---------------------------------------------

function movementCycle() {
  if (!bot.entity) return;

  // Skip the movement actions if the bot is currently sleeping
  if (isSleeping) {
    setTimeout(movementCycle, STEP_INTERVAL);
    return; 
  }

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
