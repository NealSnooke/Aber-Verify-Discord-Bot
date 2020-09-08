# Aber-Verify-Discord-Bot
Bot to perform user verification based on aber.ac.uk email account. It uses the Discord.js API. 
For technical and set up details see *README Aber Verify.txt*

# Files:
botverify.js - code entry point and command interpreter

toolsverify.js - the main functionality

auth.json - the Discord bot credentials

email.json - the email account credentials

README Aber Verify.txt - information about setting up the bot.

aber_verify is a folder that will hold a file for each user who is verified or is in the process of being verified.
aber_verify/admin.json - the aber userids of admin people this file needs to be carefully edited on the server to add new admins.
aber_verify/staff.json - the list of authorised staff userids. Admins can use the !verify-addstaff to add people.

# Bot commands
```Verify bot commands are: 

!verify uid                        Use your Aber user id (uid). e.g. abc12
                                   then look for an email in your aber email
!verify-code validation-code       Use the code sent to your aber email.

Server owner only:

!verify-channel channel-name       Restrict the specified channel to verified users.
                                   Accepts channel textual name, channel mention
                                   or channel ID
!verify-role                       Reconstruct the verified role members
                                   e.g. if role is accidently deleted
!verify-list email-adddress        Send the list of verified members for a server

Authorised staff only:

!unverify discord-uid              Remove the specified users aber-verified status
                                   (Applies to all servers)

!verify-addstaff uid                Add a new staff member
Problems, suggestions, authorisation  email: nns@aber.ac.uk```
