// Muddy points bot by Neal Snooke 3/8/2020

//https://discord.js.org/#/docs/main/stable/class/Message
//https://discord.js.org/#/docs/main/stable/class/Client
// cd 
//intro guide
//https://discordjs.guide

//full api docs
//https://discord.js.org/#/docs/main/master/general/welcome


// Muddy points Discord bot by Neal Snooke 03/08/2020

// Note that many of the commands need to be issues in a server channel since they
// request information about a server member

// This is also true of !verify uid, since it adds a user to a role on a specific server
// The code can be DM to the bot though


const prefix = '!'; //prefix for this servers commands
const alumniPerson = "afc@aber.ac.uk";


const helptext = "```Verify bot commands are: \n\n"
	+"!verify uid                        Use your Aber user id (uid). e.g. abc12\n"
	+"                                   then look for an email in your aber email\n"
	+"!verify-code validation-code       Use the code sent to your aber email.\n\n"
	
	+"Server owner only:\n\n"
	+"!verify-channel channel-name       Restrict the specified channel to verified users.\n"
	+"                                   Accepts channel textual name, channel mention\n" 
	+"                                   or channel ID\n"
	+"!verify-role                       Reconstruct the verified role members\n"
	+"                                   e.g. if role is accidently deleted\n"
	+"!verify-list email-adddress        Send the list of verified members for a server\n\n"
	
	+"Authorised staff only:\n\n"
	+"!unverify discord-uid              Remove the specified users aber-verified status\n"
	+"                                   (Applies to all servers)\n\n" 
	+"!verify-addstaff uid                Add a new staff member\n"
	+"Problems, suggestions, authorisation  email: nns@aber.ac.uk"
	+"```"
//	+"verify-addstaff aber-uid           authorise staff member for unverify and whois"

//this is where all the muddy points data for all servers is stored
//var muddypoints = []; 

const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');

const fs = require('fs'); //read files
var tools = require('./toolsverify');

/**
 *
 */
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	//console.log("client: \n"+JSON.stringify(client, null, 2));
});

/**
 *
 */
client.on('message', msg => {
	
	// delete any pinned message confirmation messages that are created by the bot
	//if (msg.type === "PINS_ADD" && msg.author.bot) 
	//	{ msg.delete().catch(console.error); 
	///}
	
	//respond to mentions but not ones generated via @everyone
	if (msg.mentions.has(client.user)) {
		if (msg.content.search("@everyone") == -1) {

			msg.channel.send(`Hi ${msg.author.username}, send me any Direct Message to find out what I do.`);
			}
	}
	
	if (msg.author.bot) return; //don't reply to my own bot messages!

	// get the command and arguments
	const args = msg.content.slice(prefix.length).trim().split(' ');
	const command = args.shift().toLowerCase();
	
	if (msg.channel.type == "dm") {
	
		// repond to code - bit of a pain because there is obviously no 
		// associated server for a direct message so therefore can't add the 
		// to be able to add the user to a role the server a code is generated 
		// from is stored in the verify data.
		if (command === 'verify-code'){ 
			console.log("code argument "+args[0]);
		
			//async function
			tools.processCode(msg, args[0], client);
			return; 
		}
		
		msg.author.send(helptext);
		return;
	}
	
	if (!msg.content.startsWith(prefix) || msg.author.bot) return;
	
	// check the server can be obtained for all subsequent commands
	if (msg.guild === null){
		//console.log("Error cant DM muddy point!");
		return;
	}

	if (command === 'verify'){
		console.log("verify argument "+args[0]);
		
		//async function
		tools.doVerify(msg, args[0]);
		
		//console.log(client.guilds.cache.map(x => x.name));
		//msg.channel.send(client.guilds.cache.map(x => x.name)
		//	.catch(console.error));
		
	} else if (command === 'verify-code'){ 
		console.log("code argument "+args[0]);
		
		//async function
		tools.processCode(msg, args[0], client);
		
	} else if (command === 'verify-alumni'){	
		
		//TODO
		msg.author.send("Hi - unfortunately we can't automatically verify Alumni. "+
		"Please send an email to "+alumniPerson+" including your discord name (e.g JohnSmith#1234) and we will add you. Include your name and if possible the year you graduated. It may take a day or two to do this if we are busy.");
		
	} else if (command === 'verify-role'){
		if (msg.author.id != msg.guild.ownerID){
			msg.author.send("Sorry - only server owner allowed recreate the aber-verified role")
			.catch(console.error);
			return
		}
		
		// this will get the role and create it if it does not exist
		// also add all members of the server who are already verified to the role
		tools.getVerifyRole(msg.guild )
		.then (role => tools.addAllVerifiedMembersToRole(msg.guild, role))
		.catch(console.error);
		
	} else if (command === 'verify-channel'){	
		//console.log("owner"+JSON.stringify(msg.guild.ownerID, null, 2));
		//console.log("user"+JSON.stringify(msg.author.id, null, 2));

		if (msg.author.id != msg.guild.ownerID){
			msg.author.send("Sorry - only server owner allowed to make verified channels!");
			return
		}
		//only server owner
		tools.makeVerifiedChannel(args[0], msg);
		
	} else if (command === 'unverify'){ 
	
		tools.unVerify(msg, args[0]); 
		
	} else if (command === 'verify-addstaff'){ 
	
		tools.addStaff(args[0], msg); 
		
	} else if (command === 'verify-list'){
		if (msg.author.id != msg.guild.ownerID){
			msg.author.send("Sorry - only server owner allowed to get the list of verified members");
			return
		}
		tools.verifiedMemberList(args[0], msg);
	}
});

/*
 *
 */
client.on('guildCreate', joinedGuild => {

	function findModerateRole(r) {
		return r.name === 'aber-verified';
	}
	
	console.log("START getModeratorRole");
/*
	//console.log("ROLES"+JSON.stringify(guild.roles.cache, null, 2));
	
	let role = joinedGuild.roles.cache.find(findModerateRole);
	
	if (role){
		console.log("the aber-verified role exists, which is a problem");
		joinedGuild.owner.send(`The *aber-verified* role already exists in server ${joinedGuild.name}! Please delete it or else I won't be able to manage messages or give correct permissions to the muddy channels...`);
		
	}
	
	//console.log("BOT JOINED NEW SERVER"+ JSON.stringify(joinedGuild, null, 2));
	console.log("BOT JOINED NEW SERVER"+ joinedGuild.name);
	
	console.log("set up aber-verified role");
	//delete it first to ensure this bot has permission
	
	tools.getModeratorRole(joinedGuild, client)
	.then ( modrole => {console.log("guildCreate: aber-verified role: "+modrole)})
	.catch (console.error);
	
	//console.log("moderator: "+result);
	//console.log("finished set up moderator role");
	*/
	console.log("FINISHED JOINING SERVER");
})

/*
 *
 */
client.on('guildMemberAdd', member => {
	console.log("New member arrived"+JSON.stringify(member, null, 2));
	
	// now check if they are already a verified member
	//console.log("guild "+member.guild);
	//console.log("Member ID: "+member.id);
	
	// get the verify role for this server
	tools.getVerifyRole(member.guild)
	.then(verifyRole => {
		//console.log("VR: "+verifyRole);
		
		// allocate this user the verified role if the are verified
		tools.allocatRoleIfVerified(member.id, verifyRole, member.guild)
		.then(r => {
			console.log("new member verify role if verified: "+r);
		})
		.catch(console.error);
	});
});

/**
 *
 */
client.login(auth.token);

/*
	if (command ===  'ping') {
		msg.channel.send('Pong.'
			+`\nThis server's name is: ${msg.guild.name}`
			+`\nThis channel is: ${msg.channel.name}`
			+`\nYour username: ${msg.author.username}`
			+`\nYour ID: ${msg.author.id}`);
		submissions.push(msg);
		
		// store data to file
		//https://stackabuse.com/reading-and-writing-json-files-with-node-js/
		let data = JSON.stringify(submissions, null, 2); //null,2 for formating
		fs.writeFileSync('mytest.json', data);

		msg.author.send('hello');
	} else 
*/