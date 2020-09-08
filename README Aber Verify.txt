NEALS TEST BOT INFO
in /Users/nealsnooke/RESEARCH/PROTOTYPES/DiscordVerifyBot 

Panopto 5min video
https://aberystwyth.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=a64b9673-413a-4e66-a81f-ac1c008a9562

Invite
Bot invite with admin permissions
https://discord.com/api/oauth2/authorize?client_id=745385515372511265&permissions=8&scope=bot

Bot management
https://discordapp.com/developers/applications/

-----

Use
DM the bot for command summary, @mention it for a massage explaining that.

Normal use case is to type !verify uid, an email will be sent to the associated aber email account with confirmation as a DM. (subsequent requests will produce an in channel response)

then paste the email as a DM to the bot !verify-code xxxxxxxxxx 
Users can also send the code in a server channel.

If the bot is running in a new server then a verified member will automatically be given the verified role in that server. 

The user can force this but using !verify uid

A server owner can use !verify-role to recreate the verified role if it is lost

A server owner can use !verify-channel channel-name/ID/mention to restrict the channel to verified users only.

!verify-list email-adddress will send the list of verified users to the supplied email address.

-----

Name: Aber Verify Bot #8952
Client ID: 745385515372511265
Client Secret: 4QSPT5gQTMT-hVqZ8JW-A2Oz6elvBeFb
Token: NzQ1Mzg1NTE1MzcyNTExMjY1.XzxAWw.Ssccf1GT26V0KVfEyDUUbpMgDTI

To update the code only:
On Mac
cd /Users/nealsnooke/RESEARCH/PROTOTYPES/DiscordVerifyBot/AberVerifyBot 
scp botverify.js nns@shellsrv.dcs.aber.ac.uk:Discord/AberVerifyBot/.
scp toolsverify.js nns@shellsrv.dcs.aber.ac.uk:Discord/AberVerifyBot/.

On shellsrv
ssh nns@shellsrv.dcs.aber.ac.uk 

The code is here:
cd /dcs/nns/Discord/AberVerifyBot

systemctl --user stop  aberverifybot
systemctl --user start  aberverifybot

ps -augx |grep nns 


To install the whole bot:
scp AberVerifyBot.zip nns@shellsrv.dcs.aber.ac.uk:Discord/AberVerifyBot.zip

ssh nns@shellsrv.dcs.aber.ac.uk 

cd Discord/
unzip AberVerifyBot.zip

To test it (without a background service):
cd /dcs/nns/Discord/AberVerifyBot
shellsrv:DiscordBotMuddy> node verifybot.js 

Setting up serviced 
Create ~/.config/systemd/user and put your .service file (below) in there.

The service files are here:
cd /dcs/nns/.config/systemd/user

You should then be able to do the following to start the service:

systemctl --user enable aberverifybot

systemctl --user start aberverifybot
systemctl --user stop aberverifybot
systemctl --user status aberverifybot

systemctl --user disable aberverifybot


systemctl --user restart muddypointsbot
journalctl -ru muddypointsbot.service

The .service file content:
/dcs/nns/.config/systemd/user/muddypointsbot.service

shellsrv:user> cat muddypointsbot.service 
[Unit]
Description=muddypointsBot
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
WorkingDirectory=/dcs/nns/Discord/MuddyBotDistro
ExecStart=/usr/bin/node bot.js

[Install]
WantedBy=multi-user.target


AQUA: 1752220,
GREEN: 3066993,
BLUE: 3447003,
PURPLE: 10181046,
GOLD: 15844367,
ORANGE: 15105570,
RED: 15158332,
GREY: 9807270,
DARKER_GREY: 8359053,
NAVY: 3426654,
DARK_AQUA: 1146986,
DARK_GREEN: 2067276,
DARK_BLUE: 2123412,
DARK_PURPLE: 7419530,
DARK_GOLD: 12745742,
DARK_ORANGE: 11027200,
DARK_RED: 10038562,
DARK_GREY: 9936031,
LIGHT_GREY: 12370112,
DARK_NAVY: 2899536,
LUMINOUS_VIVID_PINK: 16580705,
DARK_VIVID_PINK: 12320855
