require("dotenv").config();

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");

function loadTerminalChannelId() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  return config.terminalMessageChannelId;
}

function splitDiscordMessage(content) {
  const chunks = [];

  for (let index = 0; index < content.length; index += 2000) {
    chunks.push(content.slice(index, index + 2000));
  }

  return chunks;
}

async function sendMessage(channelId, content) {
  for (const chunk of splitDiscordMessage(content)) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${process.env.TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: chunk }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Discord API ${response.status}: ${errorText}`);
    }
  }
}

async function main() {
  const content = process.argv.slice(2).join(" ").trim();

  if (!process.env.TOKEN) {
    console.error("Brakuje TOKEN w pliku .env.");
    process.exit(1);
  }

  if (!content) {
    console.error("Uzycie: .\\say tresc wiadomosci");
    process.exit(1);
  }

  const channelId = loadTerminalChannelId();

  if (!channelId || channelId.includes("TU_WPISZ")) {
    console.error("Ustaw terminalMessageChannelId w config.json.");
    process.exit(1);
  }

  await sendMessage(channelId, content);
  console.log("Wiadomosc wyslana.");
}

main().catch((error) => {
  console.error("Nie udalo sie wyslac wiadomosci:", error.message);
  process.exit(1);
});
