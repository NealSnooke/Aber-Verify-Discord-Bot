const fs = require('fs'); //read files
var nodemailer = require('nodemailer'); //email

// email credentials
const emailcreds = require('./email.json');

//the file of priviledged aber staff
const StaffListFile = `aber_verify/staff.json`;
const AdminListFile = `aber_verify/admin.json`;

const emailservice = 'gmail';
const verifyRoleName = "verified";
const verifyChannelName = 'verify-newcomers'

async function allocateRoleToUser(role, guild, memberid){
	
	m = guild.members.fetch(memberid)
		.then(m => {
			console.log("member roles"+ m.roles);
			m.roles.add(role);
			
			console.log("added "+role.name+" role to DC user id"+memberid)
		})
		.catch(console.error);	
}

/*
 * remove the user from a role
 */
async function unallocateRoleToUser(role, guild, memberid, msg){
	//ensure the role is to the bot
	m = guild.members.fetch(memberid) //bot
		.then(m => {
			console.log("member roles"+ m.roles);
			m.roles.remove(role);
			
			//console.log("removed "+role.name+" role to DC user id"+memberid)

			msg.author.send("removed *"+verifyRole.name+"* role from DC user *"+m.displayName+"* ("+memberid+")")
				.catch(console.error);
		})
		.catch(console.error);
}

/*
 * checks if a user is verified and then adds them to the role if they are
 */
async function allocatRoleIfVerified(memberid, role, guild){

	console.log("Check member: "+ memberid);
	let verdata = retrieveVerificationInfo(memberid);
	
	console.log("Verification data found: "+verdata);
	
	if (verdata){
		if (verdata.status == "verified") {
			console.log("Great - user verified");
			if (role) {
				//console.log("Role: "+verifyRole.name);
				
				allocateRoleToUser(role, guild, memberid);
			}
		} else {
			console.log("Can't allocate unverified user to role");
		}
	}
}

/*
 *
 */
async function makeAllchannelsVerified(msg, server){
	//category = msg.guild.channels.cache.get(channelName)
	
	server = msg.guild;
	
	
	// force the creation of the verified role if it doesnt exits yet
	// because... https://zellwk.com/blog/async-await-in-loops/
	verifyRole = await getVerifyRole(msg.guild);
	
	msg.guild.channels.cache.forEach(
		async channel => {
			if (!channel.name.includes('verify')){
				//console.log(`Channel:`+channel.name);
				//console.log(JSON.stringify(channel.permissionOverwrites, null, 2)) 
				//JSON.stringify(channel, null, 2));
				await setVerifyPermission(msg, channel);
			}
		}
	)
	
	// find the 'newcomers' channel 
	
	let newcomers = undefined;
	
	for (var i = 0; i < msg.guild.channels.cache.array().length; i++) {
		 //console.log("x "+msg.guild.channels.cache.array()[i].name);

		 var chan = msg.guild.channels.cache.array()[i];
		 
		 if (chan.name.includes('verify')){
		 	//reset its permissions
		 	console.log("Reset permissions for "+chan.name);

		 	newcomers = chan;
		 	
		 	await chan.updateOverwrite(chan.guild.id, {VIEW_CHANNEL: true })
			.then(() =>  {
				msg.reply(
				"Success, `everyone` granted read for *"+chan.toString()+"*");
			})
			.catch(
			() => {console.log(
				"Failed to make everyone permissions for: "+chan.name);});

			await chan.updateOverwrite(verifyRole, {VIEW_CHANNEL: false })
			.then(() =>  {
				msg.reply("Success, `verifed` role read permission disabled for *"
					+chan.toString()+"*");
			})
			.catch(() => {console.log("failed to make verified role permissions for: "
				+chan.name)});;
		 }
	}
	
	// create the newcomers channel if necessary
	if (!newcomers) {
		server.channels.create(verifyChannelName, {
		type : 'text',
		permissionOverwrites: [
			{id: chan.guild.id,
			 allow: 'VIEW_CHANNEL',
			},
			{id: verifyRole,
			 deny: 'VIEW_CHANNEL',
			}
		]
		})
		.then(newchan =>  {
				msg.reply("`verify` channel not found so *"
					+verifyChannelName+"* created");
				newchan.send(
				"To gain access to this server please verify by sending the message: \n`!verify <uid>` \n where <uid> is your **Aber user id** such as abc12 ");
			})
		.catch(() => {console.log("Failed to make verify role permissions for: " 
			+verifyChannelName)});
	}
	
	// create it if it doesnt exist 
	
	// reset its permissions
}

/*
 *
 */
async function makeNoChannelsVerified(msg, server){
	//category = msg.guild.channels.cache.get(channelName)
	
	server = msg.guild;
	
	msg.guild.channels.cache.forEach(
		channel => {
			console.log(`Channel:`+channel.name);
			//  JSON.stringify(channel, null, 2));
			setNoVerifyPermission(msg, channel);
			
		}
	)
	
	//for (var i = 0; i < server.channels.array().length; i++) {
   // server.channels.array()[i].delete();
}


/*
 * to set permissions on a channel
 * everyone can't read or post
 * aber-verify role can read and post
 */
async function makeVerifiedChannel(channelName, msg){

	// is it a #channel mention
	if (channelName.startsWith('<#') && channelName.endsWith('>')) {
		channelName = channelName.slice(2, -1);
	}
	//console.log("QQQ "+channelName.charAt(0));
		
	// find the channel by name
	let category = findChannel(msg.guild, channelName);
	
	// check if it exists exist
	if (!category) {
	
		category = msg.guild.channels.cache.get(channelName)
		console.log("channel by ID "+category);
		
		if (!category){
		
			console.log(`No ${channelName} channel found`);
			msg.author.send(`Oops - I can't make ${channelName} a verified channel because it does not seem to exist...` )
			.catch(console.error);
		
			return;
		}
	}
	
	setVerifyPermission(msg, category);
}
	
/*
 *
 */
async function setVerifyPermission(msg, channel){
	//get the verified role on this server
	verifyRole = await getVerifyRole(msg.guild);
	
	if (!verifyRole) {
		msg.author.send(`Oops - I can't find the $(verifyRoleName) role` )
		.catch(console.error);
		
		return
	}
	
	console.log("making permissions for: "+channel.name+" "+channel);
	
	/*
	await channel.overwritePermissions([
		{
			id: channel.guild.id,
			deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'], //everyone
		},
		{
			id: verifyRole,
			allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
		},
	]).then(() =>  {
		msg.reply("Success, permissions set for *"+channel.toString()+"*");
	})
	.catch(() => {console.log("failed to make permissions for: "+channel.name)});
	*/
	await channel.updateOverwrite(channel.guild.id, {VIEW_CHANNEL: false })
	.then(() =>  {
		msg.reply("Success, `everyone` denied read for *"+channel.toString()+"*");
	})
	.catch(() => {console.log("failed to everyone permissions for: "+channel.name)});;
	
	await channel.updateOverwrite(verifyRole, {VIEW_CHANNEL: true })
	.then(() =>  {
		msg.reply("Success, `verify` role read permission set for *"
			+channel.toString()+"*");
	})
	.catch(() => {console.log("failed to make verify role permissions for: "
		+channel.name)});;
}

/*
 *
 */
async function setNoVerifyPermission(msg, channel){
	//get the verified role on this server
	verifyRole = await getVerifyRole(msg.guild);
	
	if (!verifyRole) {
		msg.author.send(`Oops - I can't find the $(verifyRoleName) role` )
		.catch(console.error);
		
		return
	}
	
	console.log("making permissions for: "+channel.name+" "+channel);
	/*
	await channel.overwritePermissions([
		{
			id: channel.guild.id, //everyone
		},
		{
			id: verifyRole,
			allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
		},
	]).then(() =>  {
		msg.reply("Success, permissions set for *"+channel.toString()+"*");
	})
	.catch(() => {console.log("failed to make permissions for: "+channel.name)});
	*/
	await channel.updateOverwrite(channel.guild.id, {VIEW_CHANNEL: true })
	.then(() =>  {
		msg.reply("Success, `everyone` allowed read for *"
			+channel.toString()+"*");
	})
	.catch(() => {console.log("failed to make permissions for: "
		+channel.name)});;
}

/*
 * checks all members of this server and adds any that have discord ID's that are 
 * already verified to the server
 */
async function addAllVerifiedMembersToRole(guild, role){

	//get the verified role
	verifyRole = await getVerifyRole(guild);
	
	if (!verifyRole){
		console.log("Oops - no verify role...");
	}
	
	//fetch all guild members
	m = await guild.members.fetch();

	// consider each member and att to role if verified 
	m.forEach(member => {
		console.log(member.id)
		
		allocatRoleIfVerified(member.id, verifyRole, guild)
	}); 
}

/*
 * mail the verified member list
 * must be on the "staff" list to get the user ids.
 * perhaps this is overkill, but hey...
 */
async function verifiedMemberList(emailto, msg){
	console.log("verifiedMemberList");
	
	//get the verified role
	verifyRole = await getVerifyRole(msg.guild);
	
	if (!verifyRole){
		console.log("Oops - no verify role...");
	}
	
	//fetch all guild members
	m = await msg.guild.members.fetch();
	
	str= `Verified members of Discord server: ${msg.guild.name}\n`;
	
	if (!checkStaffSender(msg, StaffListFile)){
		//Not a staff member leave out the aber uid's
		
		// consider each member and att to role if verified 
		m.forEach(member => {
		
			let verdata = retrieveVerificationInfo(member.id);
		
			if (verdata) {
				//str += member.id+" "+verdata.aberuid+"\n";
				str += member.displayName
				+", "+member.user.tag
				+" ("+verdata.status+")\n";
			}
		
			console.log(str);
		})
			
	} else {
		// consider each member 
		m.forEach(member => {

			let verdata = retrieveVerificationInfo(member.id);

			if (verdata) {
				//str += member.id+" "+verdata.aberuid+"\n";
				str += member.displayName
					+", "+verdata.aberuid
					+", "+member.user.tag
					//+", "+member.user.username
					+" ("+verdata.status+")\n";
			}

			console.log(str);
		})
	}; 
	
	sendEmail(str, emailto, msg, 'Verified members list sent.');
}

/**
 * find the aber-verified role 
 * it will be created if it does not exist.
 */
async function getVerifyRole(guild){

	function findVerifyRole(r) {
		return r.name === verifyRoleName;
	}
	
	console.log("START getVerifyRole");
	
	//console.log("ROLES"+JSON.stringify(guild.roles.cache, null, 2));
	
	let role = guild.roles.cache.find(findVerifyRole);
	
	if (role){
		// already found the role in the cache
		
		//make sure it is allocated to the bot
		//await allocateRoleToBot(role, guild, client);
		
		console.log("getVerifyRole: role found in cache: "+role);
		return role;
	}
	
	// fetch all the roles into the cache
	roles = await guild.roles.fetch();
	console.log(`There are ${roles.cache.size} roles.`)
			
	role = guild.roles.cache.find(findVerifyRole);
	if (role) { 
		//make sure it is allocated to the bot
		//await allocateRoleToBot(role, guild, client);
		
		console.log("getVerifyRole: role fetched  "+modrole);
		return role;
	}
			
	//so we can't find it at all 
	// create role if necessary and add the role to the bot
	console.log("create "+verifyRoleName+" role");
	
	role = await guild.roles.create({
		data: {
			name: verifyRoleName,
			//color: 'DARK_BLUE',
			//permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS']
		},
		reason: 'A role to allow access to verified members',
		})
		.then(modrole => {
			// set up the role as necessary...
			// add this role to this bot
			//let modrole = msg.guild.roles.cache.find(
			//	r => r.name === "muddy-moderator");
			console.log("getVerifyRole: role created: "+modrole);
			
			// TODO check all members of this guild and assign them to this role
			// if their DCUID is verified
			
			return modrole;
		})
		.catch(console.error);
	
	//make sure it is allocated to the bot
	//await allocateRoleToBot(role, guild, client);
	
	console.log("END getVerifyRole");
	return role;
}
	
/**
 * read the verified user data from a file if it exists
 * dcuid is discord userid
 *
 * returns null if not found (never tried to verify)
 */
function retrieveVerificationInfo(dcuid){
	let filename = `aber_verify/s${dcuid}.json`;
	console.log("Looking for filename: "+filename);
	
	if (fs.existsSync(filename)){
		let rawdataverify= fs.readFileSync(filename);
		//console.log("raw data: "+rawdatamuddy);
		
		verifydata = JSON.parse(rawdataverify);
		//console.log("parsed data: "+JSON.stringify(muddypoints, null, 2));
		//console.log(muddypoints.points.length+" stored server points sets loaded");
		return verifydata;
		
	}
	
	return null;
}

/**
 * store verified user
 */
function storeVerificationInfo(verifyRecord){
	// store data to file
	// https://stackabuse.com/reading-and-writing-json-files-with-node-js/
	
	let filename = `aber_verify/s${verifyRecord.dcid}.json`;
	//console.log("Store filename: "+filename);
	
	let data = JSON.stringify(verifyRecord, null, 2); //null, 2 for formating
	fs.writeFileSync(filename, data);
	
	console.log("Stored DATA: "+data+" in "+filename);
}

/* 
 *
 */
async function doVerify(msg, email){
	console.log("Do verify: ");
	
	let guild = msg.guild;
	let guildid = guild.id;
	let memberid = msg.member.id;
	
	console.log("Check member: "+ memberid);
	let verdata = retrieveVerificationInfo(memberid);
	
	let randomcode = Math.trunc((Math.random() * 10000000000));	
	
	console.log("Verification data found: "+verdata);
	
	if (verdata){
		if (verdata.status == "verified") {
			console.log("Great user already verified");
		
			//add to the verified role on this server
			verifyRole = await getVerifyRole(guild);
			
			if (verifyRole) {
				console.log("Role: "+verifyRole.name);
				
				// async function
				allocateRoleToUser(verifyRole, guild, memberid);
				
				msg.author.send(`You are now verified for server ${guild.name} - that was easy!`)
				.catch(console.error);
			}
			
			return;
		}	
		
		if (verdata.status == "unverified") {
			msg.reply('OK, sending another verfication code. Check your Direct Messages and please read your Aber email for the verfication code.')
			.catch(console.error);
		}
	}
	
	console.log("need to send email");
	
	//strip @aber.ac.uk off 
	var pos = email.indexOf("@aber.ac.uk");
	if (pos > -1){
		email = email.slice(0, pos);
		console.log("uid: "+email);
	}
	
	var pos = email.indexOf("@")
	if (pos > -1){
		msg.reply("You appear to have entered a non Aber email address. If you are an alumni please use the !verify-alumni command and the bot helpers will figure it out for you!")
	
		return;
	}
	
	verdata = { 
		dcid: memberid,
		aberuid: email,
		status: "unverified", 
		code: randomcode,
		registerguildid: guildid
	}
	
	storeVerificationInfo(verdata);
	
	emailaddr = `${email}@aber.ac.uk`;
	console.log("Generated email : "+emailaddr);
	
	sendEmail("Please verify by sending the following line as a Direct Message to the Aber Verify bot:\n\n"
		+ "!verify-code "+randomcode, emailaddr, msg, 
		'Please read your aber email for the verfication code.');
}

/**
 * process the entered code to allow verification
 */
async function processCode(msg, code, client){
	console.log("Do process code: ");
	
	//let memberid = msg.member.id;
	let memberid = msg.author.id;
	console.log("ID "+memberid);
	//console.log("message "+JSON.stringify(msg, null, 2));
	
	verdata = retrieveVerificationInfo(memberid);
	
	if (!verdata) {
		console.log("Can't find that discord user at all - please verify");
		return;
	} else {
		console.log("Verification data found: "+JSON.stringify(verdata, null, 2));
	}
	
	let guild = msg.guild;
	//TODO Do we need to check if the required guild is cached?
	
	// if it is a DM then need to find the guild that was stored with the verification code
	if (!guild) {
		guild = client.guilds.cache.get(verdata.registerguildid);
	}
	//console.log("guild "+JSON.stringify(guild, null, 2));
		
	if (verdata.dcid == memberid){
		console.log("Code from correct member");
		
		if (code == verdata.code){
		
			//the codes match accept
			verdata.status = "verified";
			
			storeVerificationInfo(verdata);
			
			//add to the verified role on this server
			verifyRole = await getVerifyRole(guild);
			//console.log("Role: "+verifyRole.name);
				
			// async function
			allocateRoleToUser(verifyRole, guild, memberid);
			
			msg.author.send(`Congratulations! You are now verified for server ${guild.name}.`)
			//msg.reply(`You are now verified for server ${guild.name}.`)
			.catch(console.error);
			
			//TODO add to the verified role on this server
		} else {
			//console.log("Incorrect code!");
			msg.author.send(`Sorry, unable to verify for server: ${guild.name}. Please check your Aber email for the verification code or request another one using !verify <aber uid> in a server channel.`)
			.catch(console.error);
		}
	
	} else {
		console.log("Something is definitely wrong...");
	}
}

/*
 * sent an email
 */
function sendEmail(data, email, msg, reply){
	var transporter = nodemailer.createTransport({
			service: emailservice,
			auth: emailcreds,
		});

		var mailOptions = {
		  from: emailcreds.user,
		  to: email,
		  subject: 'Aber Discord Verification Bot',
		  text: data
		};

		transporter.sendMail(mailOptions, function(error, info){
			if (error) {
				console.log(error);
				msg.channel.send('Email failed: ' + error)
					.catch(console.error);
			} else {
				console.log('Email sent: ' + info.response);
				msg.author.send(reply)
				//msg.reply('please read your aber email for the verfication code.')
				//msg.reply(reply)
					.catch(console.error);
			}
		});
}

/*
 * check if the user is listed as an Aber staff member
 */
function checkStaffSender(msg, ListFile){
	var reqdname = '';
	var item = null;
	
	function findStaff(r) {
		//console.log("findStaff "+reqdname);
		return r == reqdname;
	}
	
	//let role = joinedGuild.roles.cache.find(findModerateRole);
	//console.log("unverify");
	
	let memberid = msg.member.id;
	console.log("unverify member "+memberid);
	
	let guild = msg.guild;
	
	// fetch the verification data to get the aber uid info
	let verdata = retrieveVerificationInfo(memberid);
	
	if (verdata){
		console.log("unverify message from "+verdata.aberuid)//+" for "+memberid);
		
		//is the message from a verified staff member
		staff = findStaffList(ListFile);
		console.log(JSON.stringify(staff, null, 2));
		
		reqdname = verdata.aberuid;
		console.log("Looking for staff: "+reqdname);
		
		item = staff.aberuid.find(findStaff);
		
		console.log("Found: "+item);
		return item
		
	} else {
		//console.log("Not a verified member :"+reqdname);
		return null
	}
}

/*
 * allow staff members to remove someone from the verified list.
 */
async function unVerify(msg, whoid){
	
	if (!checkStaffSender(msg, StaffListFile)){
		console.log("Not a staff member :");
		
		msg.author.send(`You do not have permission to use !unverify`)
				.catch(console.error);
	} else {
		// so we can remove the verification
		let verdata = retrieveVerificationInfo(whoid);
		if (verdata) {
		
			//add to the verified role on this server
			verifyRole = await getVerifyRole(msg.guild);
			
			// leave the users entry (as a record) but reset to another random code 
			// potentially we could use this to block users but not implemented yet (no need?)
			// user will have to request another code.
			verdata.status = "unverified";
			var c = Math.trunc((Math.random() * 10000000000));
			verdata.code = c; //prevent reverification with the same code
			
			unallocateRoleToUser(verifyRole, msg.guild, whoid, msg);
			
			storeVerificationInfo(verdata);
			
		} else {
			console.log("Couldn't find the member to unverify :"
			+whoid
			+" .You must use the members numeric discord ID. "
			+ "Right click on their icon and use CopyID and past it in!");
			
			msg.author.send("Couldn't find the member to unverify :"+whoid)
				.catch(console.error);
		}
	}
}

/*
 * load the staff list file
 */
function findStaffList(ListFile){
	
	//console.log("Looking for filename: "+filename);
	
	if (fs.existsSync(ListFile)){
		console.log("found staff file");
		
		let rawdata = fs.readFileSync(ListFile);
		//console.log("raw data: "+rawdatamuddy);
		
		stafflist = JSON.parse(rawdata);
		//console.log("parsed data: "+JSON.stringify(muddypoints, null, 2));
		//console.log(muddypoints.points.length+" stored server points sets loaded");
		return stafflist;
		
	} else {
		console.log("no staff file found");
		var pointsArray = [];
		stafflist = {
			aberuid: pointsArray,
		};
		
		let data = JSON.stringify(stafflist, null, 2); //null, 2 for formating
		
		fs.writeFileSync(StaffListFile, data);
		
		return stafflist;
	}
}

/*
 * add a member of staff, other staff can do this
 * 07092020 now anyone in the aber_verify/admin.json list can
 * that list needs editing by hand, so must be done by someone
 * with write permissions on the bots host machine.
 */
function addStaff(uid, msg){
	var item = null;

	function findStaff(r) {
		//console.log("findStaff "+reqdname);
		return r == uid;
	}
	
	if (!checkStaffSender(msg, AdminListFile)){
		console.log("Not an admin member :");
		
		msg.author.send(`You do not have permission to use !verify-addstaff`)
			.catch(console.error);
	} else {
	//only nns allowed to do this
	//if (msg.author.id == '689153168520642744'){
	
		//add the member to the staff list file
		staff = findStaffList(StaffListFile);
		item = staff.aberuid.find(findStaff);
		
		if (item) {
			msg.author.send(`Aber user ${uid} is already a Verify bot Admin`)
			.catch(console.error);
		} else {
			stafflist.aberuid.push(uid);
			msg.author.send(`Added ${uid} as a new staff member`)
			.catch(console.error);
		}
		
		let data = JSON.stringify(stafflist, null, 2); //null, 2 for formating
		fs.writeFileSync(StaffListFile, data);
	}
}

/*
 * find the required server text channel by name
 */
function findChannel(server, channelName) {
	//find the muddy points channel
	let category = server.channels.cache.find(
		c => c.name == channelName && c.type == "text");
		
	console.log("Channel found in cache: "+channelName);
	
	return category;
}

/**
 * the externally visable functions
 */
module.exports = {
	doVerify : doVerify,
	processCode : processCode,
	getVerifyRole : getVerifyRole,
	addAllVerifiedMembersToRole : addAllVerifiedMembersToRole,
	allocatRoleIfVerified : allocatRoleIfVerified,
	makeVerifiedChannel : makeVerifiedChannel,
	makeAllchannelsVerified : makeAllchannelsVerified,
	makeNoChannelsVerified : makeNoChannelsVerified,
	unVerify : unVerify,
	addStaff : addStaff,
	verifiedMemberList : verifiedMemberList
}; //end module.exports
