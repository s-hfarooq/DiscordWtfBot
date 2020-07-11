// Load requirements
const Discord = require("discord.js");
const config = require("./util/config.json");
const qVars = require("./util/qVariables.js");
const qFuncs = require("./util/functions.js");
const commands = require("./util/commands.js");

// Runs on start
qVars.CLIENT.on("ready", () => {
  console.log(`Bot has started`);
  qVars.CLIENT.user.setActivity(`otter help`);

  qFuncs.getMessagesWithAttachments(qVars.CLIENT.channels.cache.get(qVars.BROWNOUTID)).then(output => {
    qVars.brownoutOut = output;
  });

  qFuncs.getMessagesWithAttachments(qVars.CLIENT.channels.cache.get(qVars.QUOTEID)).then(output => {
    qVars.quotesOut = output;
  });

  qVars.lastUpdate = Date.now();
});

// Runs on join new server
qVars.CLIENT.on("guildCreate", guild => {
  console.log(`New guild joined`);
  qVars.CLIENT.user.setActivity(`otter help`);
});

// Runs on leave server
qVars.CLIENT.on("guildDelete", guild => {
  console.log(`Bot has been removed from a guild`);
  qVars.CLIENT.user.setActivity(`otter help`);
});

// Runs on message deletion
qVars.CLIENT.on('messageDelete', message => {
  // Ignore bot messages
  if (message.author.bot)
    return;

  if (message.cleanContent) {
    var msg = message.cleanContent;

    if (message.cleanContent.length > 1020)
      msg = msg.substr(0, 1020) + "...";

    qVars.lastDeletedMessage = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setAuthor('Message Deleted')
          .addField(message.member.user.tag, msg)
          .addField("Channel", message.channel.name)
          .addField("Time", new Date().toLocaleString());

    qVars.CLIENT.channels.cache.get(qVars.LOGID).send({ embed: qVars.lastDeletedMessage });
  }
});

// Runs on message edit
qVars.CLIENT.on('messageUpdate', (oldMessage, newMessage) => {
  // Ignore bot messages
  if (newMessage.author.bot)
    return;

  // Ignore messages that are identical (ie. when links get a preview)
  if (oldMessage.cleanContent == newMessage.cleanContent)
    return;

  // Ensure messages aren't blank
  if (oldMessage.cleanContent && newMessage.cleanContent) {
    // Make sure text isn't too long
    var oldMsg = oldMessage.cleanContent, newMsg = newMessage.cleanContent;
    if (oldMsg.length > 1020)
      oldMsg = oldMsg.substr(0, 1020) + "...";
    if (newMsg.length > 1020)
      newMsg = newMsg.substr(0, 1020) + "...";

    var logMsg = new Discord.MessageEmbed()
          .setColor('#F0E68C')
          .setAuthor('Message Edited')
          .addField("Old message", oldMsg)
          .addField("New message", newMsg)
          .addField("User", newMessage.member.user.tag)
          .addField("Channel", newMessage.channel.name)
          .addField("Time", new Date().toLocaleString());

    qVars.CLIENT.channels.cache.get(qVars.LOGID).send({ embed: logMsg });
  }
});

// Runs when a new message is sent on a server
qVars.CLIENT.on("message", async message => {
  // Counting game moderation
  if (message.channel.id === qVars.COUNTINGGAMEID) {
    qFuncs.countingGameModeration(message);
    return;
  }

  // Don't respond to bots
  if (message.author.bot)
    return;

  var command = message.content;
  var override = false;

  // Make sure message starts with 'queen' or 'q'
  const cmdLr = command.toLowerCase();
  if (cmdLr.startsWith("otter ") || cmdLr.startsWith("o ") || cmdLr.startsWith("queen ") || cmdLr.startsWith("q ")) {
    override = true;
    command = command.substr(command.indexOf(" ") + 1);
  }

  // If command is not run in general channel or if the gap between last command is greater than generalTimeGap, command will be run
  var currentTime = Math.round((new Date().getTime() / 1000));
  var timeDiff = currentTime - qVars.generalLastCommandTime;
  if (override) {
    if (message.channel.id !== qVars.GENERALID || timeDiff >= qVars.GENERALTIMEGAP) {
      // Get command keyword
      var keyword = command.replace(/\s.*/,'').toLowerCase();

      // If trying to use buff command, get the [name] desired
      var buffName = "";
      if (keyword.startsWith("buff")) {
        keyword = "buff";
        buffName = command.substr(4).trim();
      }

      // Find command and send message
      var command = command.substr(keyword.length + 1);
      commands.cmds(message, keyword, command, buffName);

      if (message.channel.id === qVars.GENERALID)
        qVars.generalLastCommandTime = Math.round((new Date().getTime() / 1000));
    } else if (timeDiff < qVars.GENERALTIMEGAP) {
      message.channel.send("Slow down!");
    }
  }
});

// Runs on reaction added
qVars.CLIENT.on('messageReactionAdd', async (reaction, user) => {
  let message = reaction.message;

  // Set pronoun roles
  if (message.channel.name == 'set_roles_here') {
      if (reaction.emoji.name === "1️⃣") {
        let he_him = message.guild.roles.cache.find(role => role.name === "He/Him");
        reaction.message.guild.member(user.id).roles.add(he_him);
      }
      if (reaction.emoji.name === "2️⃣") {
        let she_her = message.guild.roles.cache.find(role => role.name === "She/Her");
        reaction.message.guild.member(user.id).roles.add(she_her);
      }
      if (reaction.emoji.name === "3️⃣") {
        let they_them = message.guild.roles.cache.find(role => role.name === "They/Them");
        reaction.message.guild.member(user.id).roles.add(they_them);
      }
  }
});

// Runs on reaction removed
qVars.CLIENT.on('messageReactionRemove', async (reaction, user) => {
  let message = reaction.message;

  // Remove pronoun roles
  if (message.channel.name == 'set_roles_here') {
      if (reaction.emoji.name === "1️⃣") {
        let he_him = message.guild.roles.cache.find(role => role.name === "He/Him");
        reaction.message.guild.member(user.id).roles.remove(he_him);
      }
      if (reaction.emoji.name === "2️⃣") {
        let she_her = message.guild.roles.cache.find(role => role.name === "She/Her");
        reaction.message.guild.member(user.id).roles.remove(she_her);
      }
      if (reaction.emoji.name === "3️⃣") {
        let they_them = message.guild.roles.cache.find(role => role.name === "They/Them");
        reaction.message.guild.member(user.id).roles.remove(they_them);
      }
  }
});

qVars.CLIENT.login(config.token);
