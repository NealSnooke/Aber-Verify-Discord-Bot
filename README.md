# Aber-Verify-Discord-Bot
Bot to perform user verification based on aber.ac.uk email account. It uses the Discord.js API. 
For technical and set up details see *README Aber Verify.txt*

#Files:
botverify.js    
toolsverify.js

auth.json
email.json



# Bot commands
Verify bot commands are: 

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

verify-addstaff uid                Add a new staff member
Problems, suggestions, authorisation  email: nns@aber.ac.uk
