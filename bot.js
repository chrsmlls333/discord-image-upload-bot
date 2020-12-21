// jshint node: true, esversion: 6, asi: true

// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
// Put it in config.json as 'botToken'

const Discord = require('discord.js')
const client = new Discord.Client()

const fs = require('fs')
const path = require('path')

const config = require('./config.json')

//==============================================================================

var posting = false;
var imageIndex, imageIndexLimit, imageArray;
var imageDir = path.resolve(__dirname, config.imageFolder)

//==============================================================================

client.on('ready', () => {
	//My name
	console.log("\nConnected as " + client.user.tag)

	// List servers the bot is connected to
	console.log("\nServers:")
	client.guilds.forEach((guild) => {
		console.log(" - " + guild.name)

		// List all channels
		guild.channels.forEach((channel) => {
			console.log(`   - ${channel.name} (${channel.type}) - ${channel.id}`)
		})
	})

	// Send a ping
	// var targetChannel = client.channels.get(config.channelID) // Edit in config.json
  console.log("\nPosting from:")
  console.log(imageDir)
  console.log('=====')
})


client.on('message', (receivedMessage) => {
	if (receivedMessage.author == client.user) return // Prevent bot from responding to its own messages
	// console.log(receivedMessage.content)

  if (receivedMessage.author.id != config.approvedUserID) return //only I can use this

  if (receivedMessage.content.startsWith("%")) {
    processCommand(receivedMessage)
  }
})



client.login(config.botToken)


//==============================================================================



function processCommand(receivedMessage) {
    let fullCommand = receivedMessage.content.substr(1) // Remove the leading exclamation mark
    let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
    let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
    let args = splitCommand.slice(1) // All other words are arguments/parameters/options for the command

    console.log("Command received: " + primaryCommand)
    console.log("  Arguments: " + args) // There may not be any arguments

    if (primaryCommand == "start") {
        startPosting(args, receivedMessage)
    } else if (primaryCommand == "stop") {
        stopPosting(args, receivedMessage)
    } else {
        receivedMessage.channel.send("I don't understand the command. Try `%start` or `%stop`")
    }
}



function startPosting(args, receivedMessage) {
  //START COMMAND
  if (posting) {
    receivedMessage.channel.send("Already posting!")
    console.log("Already posting!")
    return
  }
	posting = true;

  imageIndex = 0;
  imageIndexLimit = -1;
  if (args.length > 0) {
    if (isNumeric(parseInt(args[0]))) {
      imageIndexLimit = parseInt(args[0])
    }
  }

  imageArray = getFileList();
  if (imageArray == -1) {
    posting = false;
    channel.send("Error: no images available...")
    console.log("Error: no images available...")
    return
  }

  let currentNumberOfFiles = imageArray.length;
  if (imageIndexLimit != -1) {
    currentNumberOfFiles = Math.min(imageArray.length, imageIndexLimit);
  }

  receivedMessage.channel.send(`Posting ${currentNumberOfFiles} files from archive...`)
  console.log(`Posting ${currentNumberOfFiles} files from archive...`)

	postImage(receivedMessage.channel)



  function postImage(channel) {
		if (!posting) return

    let filePath = imageArray[imageIndex]
		const localFileAttachment = new Discord.Attachment(imageDir + "/" + filePath)
		channel.send(localFileAttachment)
    console.log("Image sent: " + filePath)

    imageIndex++
    if (imageIndex >= imageArray.length) {
      channel.send("Exhausted my supply...")
      console.log("Exhausted my supply...")
      posting = false
      return
    }
    if (imageIndexLimit != -1 && imageIndex == imageIndexLimit) {
      channel.send(`Limit of ${imageIndexLimit} reached...`)
      console.log(`Limit of ${imageIndexLimit} reached...`)
      posting = false
      return
    }
		setTimeout(postImage, rand(config.interval[0], config.interval[1])*1000, channel)
	}
}

function getFileList() {
  var files
  try {
    files = fs.readdirSync(imageDir)
  } catch (err) {
    return -1
  }

  var regex = RegExp('([a-zA-Z0-9\\s_\\\\.\\-\\(\\):])+(.jpe?g|.png|.webp|.gif)$');
  files = files.filter(
    (a) => regex.test(a)
  )
  if (files.length < 1) return -1

  if (config.shuffled) files = shuffle(files)

  return files

  // console.log(files)
  // let chosenFile = files[Math.floor(Math.random() * files.length)]
  // let absPath = imageDir + "/" + chosenFile
  // return absPath
}




function stopPosting(args, receivedMessage) {
  //STOP COMMAND
  posting = false;

  let currentNumberOfFiles = imageArray.length;
  if (imageIndexLimit != -1) {
    currentNumberOfFiles = Math.min(imageArray.length, imageIndexLimit);
  }

  receivedMessage.channel.send(`Stopped posting after ${imageIndex}/${currentNumberOfFiles} files done...`)
  console.log(`Stopped posting after ${imageIndex}/${currentNumberOfFiles} files done...`)
}




//==============================================================================

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function isNumeric(num){
  return !isNaN(num)
}
