const Discord = require('discord.js');
const client = new Discord.Client();

let activeGuild;
let roleBool = false;

let roleArraySize = 0;

//The given assigned list
let gameRolesArray;

let gameIsReady = false;

let helpString = '!help';

//List of commands
let commandArray = [];

let assignString = '!assign';
let startString = '!start';
let createString = '!create';
let exitString = '!exit';
let pointString = '!point';
let voteString = '!vote';

//People in room1
let room1Array = [];
//People in room2
let room2Array = [];

//The people in the voice channel who will play the game
let membersArray = [];

//Ordered representation of the roles. Each index is linked with each index of the de facto members array(shuffled)
let orderedRolesArray = [];

let leaderVotesArray = [];

//Leaders of each room
let leader1;
let leader2;

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	console.log(client);
	
	commandArray.push(assignString);
	commandArray.push(startString);
	commandArray.push(createString);
	commandArray.push(exitString);
	commandArray.push(pointString);
	commandArray.push(voteString);
	
	activeGuild = client.guilds.first();
});

client.on('message', message => {
	
	let messageStringArray = message.content.replace(/\s\s+/g, ' ').split(" ").map(part => part.trim());
	
	if(roleBool === true && checkEligibilityToCommand(message))
	{
		
		orderedRolesArray = [];
		membersArray = [];
		
		//////////////////////////////////////////////////////////////////let roleText = message.content;
		let roleText = 'President,Bomber,Spy';
		roleBool = false;
		
		gameRolesArray = roleText.split(",").map(gameRole => gameRole.trim());
		
		roleArraySize = gameRolesArray.length;
		
		console.log(gameRolesArray);
		
		message.reply('List received successfully. Create a game.');
		
		gameIsReady = true;
	}
	
	//If the message is '!assign'
	else if(message.content === assignString && checkEligibilityToCommand(message))
	{
		message.channel.send('Awaiting role list.');
		roleBool = true;
	}
	
	//If the message is '!create'
    else if(message.content === createString && checkEligibilityToCommand(message)) {
		
		//Creates an Array of GuildMembers, which are in the GameQueue Voice channel.
		 tempMembArr = activeGuild.channels.find(ch => ch.name === 'GameQueue').members.array();
		 for(let member of tempMembArr)
		 {
			membersArray.push(member);
		 }
		 
		
		
		//Shuffles the array
		shuffleArray(membersArray);
		
		membersArraySize = membersArray.length;
		
		//The RoleArray is empty or most probably undeclared
		if(roleArraySize == 0)
		{
			//This should be an exception
		}
		
		//There are less people than roles
		else if(membersArraySize < roleArraySize)
		{
			message.reply('There are not enough people in the voice channel. Missing people: ' + (roleArraySize - membersArraySize));
		}
		
		//The roles are equal to the players.
		else if(membersArraySize === roleArraySize)
		{
			message.reply('There are enough people to start the game. Type !start to begin.');
		}
    }
	
	//If the message is '!startGame'
	else if(message.content === startString && checkEligibilityToCommand(message) && gameIsReady === true)
	{				
		let actualSize = roleArraySize;
		
		let smallerArray = gameRolesArray;
		
		for(let member of membersArray)
		{
			let tempInt = getRandomInt(actualSize);
			
			let messageTxt = smallerArray[tempInt];
			
			//Adds the role to the ordered Array
			orderedRolesArray.push(messageTxt);
			
			member.send('Your role is: ' + messageTxt);
			
			gameRolesArray.splice(tempInt, 1);
			actualSize--;
		}
		
		console.log(orderedRolesArray);
		console.log(membersArray);
		
		populateVoteArray();
		
		gameSequence();
	}
	
	//If the message is '!exit'
	else if(message.content === exitString && checkEligibilityToCommand(message))
	{				
		let role1;
		let role2;
		//Add leaders here
		for(let role of activeGuild.roles.array())
		{
			if(role.name === 'Room1')
			{
				role1 = role;
			}
			else if(role.name === 'Room2')
			{
				role2 = role;
			}
			// Add anything else here
		}
		
		for(let member of membersArray)
		{
			for(let role of member.roles.array())
			{
				if(role.name === 'Room1')
				{
					member.removeRole(role1).then(guildMember => {	console.log("removing room1");
					}).catch(error => {
						console.log(member + ' does not have ' + role1 + ' Error code: ' + error);
					})
				}
				else if(role.name === 'Room2')
				{
					member.removeRole(role2).then(guildMember => {	console.log("removing room2");
					}).catch(error => {
						console.log(member + ' does not have ' + role2 + ' Error code: ' + error);
					})
				}
			}
			
			member.addRole(activeGuild.roles.array().find(r => r.name === 'Not In Game')).then(console.log).catch(console.error);
			
			member.setVoiceChannel(activeGuild.channels.find(c => c.name === 'GameQueue'));
		}
	}
	
	//If the message is '!help'
	else if(message.content === helpString && checkEligibilityToCommand(message))
	{				
		let commandList = "";
		
		let i;
		for(i=0; i < commandArray.length; i++)
		{
			commandList += commandArray[i] + "\n";
		}
		
		message.reply('Available commands are: \n\n' + commandList);
	}
	
	//If the message is !'point' and room is 1
	else if (messageStringArray[0] === pointString && message.channel.name === 'room-1')
	{
		//Catches null and undefined
		if(leader1 == null)
		{
			for(let member of membersArray)
			{
				if(member.displayName === messageStringArray[1])
				{
					leader1 = member;
					leader1.addRole(activeGuild.roles.find(r => r.name === 'LeaderR1'));
				}
			}
			message.channel.send(leader1.displayName + " is the first leader of the room. Give them a round of applause.");
		}
		else
		{
			message.channel.send("There is already a leader in this room. You cannot point anymore.");
		}
	}
	//If the message is !'point' and room is 2
	else if (messageStringArray[0] === pointString && message.channel.name === 'room-2')
	{
		//Catches null and undefined
		if(leader2 == null)
		{
			for(let member of membersArray)
			{
				if(member.displayName === messageStringArray[1])
				{
					leader2 = member;
					leader2.addRole(activeGuild.roles.find(r => r.name === 'LeaderR2'));
				}
			}
			message.channel.send(leader2.displayName + " is the first leader of the room. Give them a round of applause.");
		}
		else
		{
			message.channel.send("There is already a leader in this room. You cannot point anymore.");
		}
	}
	
	//If the message is !'vote' and room is 1
	else if(messageStringArray[0] === voteString && message.channel.name === 'room-1')
	{
		for(let pair of leaderVotesArray)
		{
			if(pair.guildMember.displayName === messageStringArray[1])
			{
				pair.votes++;
				if(pair.votes >= (Math.ceil(room1Array.length/2)+1))
				{
					//removes role from previous leader, adjusts the position and gives new leader the role
					let leaderRole = activeGuild.roles.find(r => r.name === 'LeaderR1');
					leader1.removeRole(leaderRole).catch(console.error);
					leader1 = pair.guildMember;
					leader1.addRole(leaderRole).catch(console.error);
					
					let roomRole = activeGuild.roles.find(r => r.name === 'Room1');
					console.log(roomRole);
					for(let pair of leaderVotesArray)
					{
						for(let role of pair.guildMember.roles)
						{
							console.log(role);
							if(role === roomRole)
							{
								pair.votes = 0;
								console.log(pair.votes);
							}
						}
					}
					
					message.channel.send("The new leader is " + leader1.displayName + ". All votes have been reset.");
				}
			}
		}
		
		
	}
	
	//If the message is !'vote' and room is 2
	else if(messageStringArray[0] === voteString && message.channel.name === 'room-2')
	{
		for(let pair of leaderVotesArray)
		{
			if(pair.guildMember.displayName === messageStringArray[1])
			{
				pair.votes++;
				if(pair.votes >= (Math.ceil(room2Array.length/2)+1))
				{
					//removes role from previous leader, adjusts the position and gives new leader the role
					let leaderRole = activeGuild.roles.find(r => r.name === 'LeaderR2');
					leader2.removeRole(leaderRole).catch(console.error);
					leader2 = pair.guildMember;
					leader2.addRole(leaderRole).catch(console.error);
					
					let roomRole = activeGuild.roles.find(r => r.name === 'Room2');
					for(let pair2 of leaderVotesArray)
					{
						for(let role of pair2.guildMember.roles)
						{
							console.log(role);
							if(role === roomRole)
							{
								pair2.votes = 0;
							}
						}
					}
					
					message.channel.send("The new leader is " + leader2.displayName + ". All votes have been reset.");
				}
			}
		}
		
		
	}

	//If the message is '!share'
	else if(message.channel.name === 'room-1' || message.channel.name === 'room-2')
	{
		if(messageStringArray[0] === '!share')
		{
			checkEligibilityToShare(message);
		}
	}
	
	//Accepts a request to share CARDS. Finds both users and gives them each other's cards.
	else if(message.channel.type === 'dm' && messageStringArray[0] === '!accept')
	{
		let previousMessage;
		message.channel.fetchMessages({limit:2}).then(messagesCol => {
			previousMessage = messagesCol.last().content;
			let stringArray = previousMessage.replace(/\s\s+/g, ' ').split(" ").map(part => part.trim());

			let replacedString = stringArray[0].replace('<@', '');
			replacedString = replacedString.replace('>', '');
			
			
			for(let member of membersArray)
			{

				if(member.id === replacedString)
				{
					//Sends each other's roles. message.author.displayName
					message.author.send(member.displayName + " is " + getMemberRole(member));
					member.send(activeGuild.members.find(m => m.id === message.author.id).displayName + " is " + getMemberRole(message.author));
				}
			}
		}).catch(error => {
			console.log(error);
		})
	}
	else if(message.channel.type === 'dm' && messageStringArray[0] === '!decline')
	{
		let previousMessage;
		message.channel.fetchMessages({limit:2}).then(messagesCol => {
			previousMessage = messagesCol.last().content;
			console.log(previousMessage);
			let stringArray = previousMessage.replace(/\s\s+/g, ' ').split(" ").map(part => part.trim());
			
			let replacedString = stringArray[0].replace('<@', '');
			replacedString = replacedString.replace('>', '');
			
			for(let member of activeGuild.members.array())
			{
				if(member.id === stringArray[0])
				{
					//Signals the other person that his request has been declined.
					member.send(message.author + " has refused to share with you.");
				}
			}
		}).catch(error => {
			console.log(error);
		})
	}
	
});

function gameSequence() {
	let i = 0;
	for(let member of membersArray)
	{		
		if(i % 2 === 0)
		{
			room1Array.push(member);
			//Assigns Room1 to member
			member.addRole(activeGuild.roles.array().find(r => r.name === 'Room1')).then(console.log).catch(console.error);
			console.log("adding to Room1");
			//Sends the member to correct voice channel
			member.setVoiceChannel(activeGuild.channels.find(c => c.name === 'Room 1'));
		}
		else 
		{
			room2Array.push(member);
			//Assigns Room2 to member
			member.addRole(activeGuild.roles.array().find(r => r.name === 'Room2')).then(console.log).catch(console.error);
			console.log("adding to Room2");
			//Sends to correct voice channel
			member.setVoiceChannel(activeGuild.channels.find(c => c.name === 'Room 2'));
		}
		//Removes the role Not In Game from player
		member.removeRole(activeGuild.roles.array().find(r => r.name === 'Not In Game')).then(guildMember => {
				
		}).catch(error => {
			console.log(member + ' does not have Not In Game role. ' + ' Error code: ' + error);
		});
		i++;
	}
}

//Returns a string of the role of a member
function getMemberRole(guildMember)
{
	let i;
	for(i = 0; i < membersArray.length; i++)
	{
		if(membersArray[i].id === guildMember.id)
		{
			return orderedRolesArray[i];
		}
	}
}

///Temporary random function
function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

//Returns an array of all guild members
function getGuildMembersArray()
{
	return activeGuild.members.array();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//Fills the leaderVotesArray with values.
function populateVoteArray()
{
	for(let member of membersArray)
	{
		leaderVotesArray.push({guildMember:member, votes:0});
	}
}

//Method that check if a message author is eligible to command the bot
//Must pass a message parameter
function checkEligibilityToCommand(message)
{
	//This is a GuildMember class that extends regular User
	//It is important to access the roles
	//The guildAuthor is the GuildMember which posted the message
	let guildAuthor;
	for(let member of getGuildMembersArray())
	{
			if(member.id === message.author.id)
			{
				guildAuthor = member;
			}
	}
	
	//We get an array of roles and check if he has the authenticity to use bot commands.
	let rolesArray = guildAuthor.roles.array();
	let hasAuthentication = false;

	for(let role of rolesArray)
	{
		if(role.name === 'Bot Administrator')
		{
			hasAuthentication = true;
		}
	}
	
	//If he has, returns true, otherwise false
	if(message.channel.name === 'bot-testing' && hasAuthentication)
	{
		return true;
	}
	else
	{
		return false;
	}
}

//Checks wether or not a person can share his role with another person.
function checkEligibilityToShare(message)
{
	let stringMessage = message.content.replace(/\s\s+/g, ' ').split(" ").map(part => part.trim());
	let messagePartsArray = message.content.split(" ").map(part => part.trim());
	
	if(messagePartsArray[0] === '!share')
	{
		//This is a GuildMember class that extends regular User
		//It is important to access the roles
		//The guildAuthor is the GuildMember which posted the message
		let guildAuthor;
		for(let member of getGuildMembersArray())
		{
				if(member.id === message.author.id)
				{
					guildAuthor = member;
				}
		}
		
		
		//We get an array of roles and check if he has the authenticity to use bot commands.
		let rolesArray = guildAuthor.roles.array();
		

		for(let role of rolesArray)
		{
			if(role.name === 'Room1')
			{
				for(let roomMember of room1Array)
				{
					if(roomMember.displayName === messagePartsArray[1])
					{
						for(let memberRole of roomMember.roles.array())
						{
							if(memberRole.name === 'Room1')
							{
								//Sender, target
								shareNotification(guildAuthor,roomMember);
							}
						}
					}
				}
			}
			else if(role.name === 'Room2')
			{
				for(let roomMember of room1Array)
				{
					if(roomMember.displayName === messagePartsArray[1])
					{
						for(let memberRole of roomMember.roles.array())
						{
							if(memberRole.name === 'Room2')
							{
								shareNotification(guildAuthor,roomMember)
							}
						}
					}
				}
			}
		}
	}
}

//Finds which room a member is in, and sends them to the other.
//Accepts guildMember
function hostageTravel(hostage)
{
	for(let role of hostage.roles)
	{
		if(role.name === 'Room1')
		{
			hostage.removeRole(role).catch(console.error);
			for(let addRole of activeGuild.roles)
			{
				if(addRole.name === 'Room2')
				{
					hostage.addRole(addRole).catch(console.error);
					hostage.setVoiceChannel(activeGuild.channels.find(c => c.name === 'Room 2'));
					
				}
			}
		}
		else if(role.name === 'Room2')
		{
			hostage.removeRole(role);
			for(let addRole of activeGuild.roles)
			{
				if(addRole.name === 'Room1')
				{
					hostage.addRole(addRole).catch(console.error);
					hostage.setVoiceChannel(activeGuild.channels.find(c => c.name === 'Room 1'));
				}
			}
		}
	}
}

function shareNotification(sender, target)
{
	target.send(sender + " has requested to CARD share with you. Type !accept or !decline");
}

client.login('NjYyMzkyNTAwODE5ODUzMzIz.XhifbA.yGkGmVdV3bD_KhVyVc8vwPYoz90');
