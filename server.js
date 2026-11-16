
const express = require("express");

const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v27.0";

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Messenger messages
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  if (req.body.object !== "page") return;

  for (const entry of req.body.entry || []) {
    for (const event of entry.messaging || []) {
      if (event.message && !event.message.is_echo) {
        const senderId = event.sender.id;
        const message = event.message.text || "";

        const reply = getReply(message);

        try {
          await sendMessage(senderId, reply);
        } catch (error) {
          console.error("Message sending failed:", error.message);
        }
      }
    }
  }
});

// Bengali automatic replies
function getReply(message) {
  const text = message.toLowerCase();

  if (text.includes("হাই") || text.includes("হ্যালো") || text.includes("hello")) {
    return "হ্যালো বন্ধু! 😊 কেমন আছো?";
  }

  if (text.includes("কেমন আছো")) {
    return "আমি ভালো আছি! তোমার সাথে কথা বলতে পেরে ভালো লাগছে। ❤️";
  }

  if (text.includes("মন খারাপ")) {
    return "মন খারাপ করো না বন্ধু। আমি আছি, চাইলে আমার সাথে গল্প করতে পারো। ❤️";
  }

  if (text.includes("গল্প")) {
    return "চলো গল্প করি! 😃 তুমি কি মজার গল্প শুনতে চাও, নাকি রহস্যের গল্প?";
  }

  if (text.includes("নাম")) {
    return "আমার নাম Bestie Bot! তোমার AI বন্ধু। 🤖";
  }

  return "তোমার কথা শুনছি বন্ধু! 😊 আরেকটু বিস্তারিত বলবে?";
}

// Send reply to Messenger
async function sendMessage(recipientId, text) {
  if (!PAGE_ACCESS_TOKEN) {
    throw new Error("PAGE_ACCESS_TOKEN is missing");
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text }
    })
  });

  if (!response.ok) {
    throw new Error(`Meta API error: ${response.status}`);
  }
}

// Server status
app.get("/", (req, res) => {
  res.send("Bestie Bot is running!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Bestie Bot running on port ${PORT}`);
});
