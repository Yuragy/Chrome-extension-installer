**Commands for the installer** 
restart_chrome - Restarts Chrome for the victim 
update_extension - Loads a new extension and removes the old one.
delete - Deletes itself completely and all temporary files and records 
load_and_run - Loads any file into the system and executes it 

Auth: 
Login: admin 
Password: admin 

**Panel Structure**
panel/
├─── server/
│ ├─── server.js # Server main file
│ ├─── routes/         
│ │ │ ├──── commands.js # Route for working with commands
│ │ ├──── auth.js # Route for working with authorization
│ │ ├├─── config.js # Route for working with configuration
│ └──── public/          
│ ├─── index.html # Home 
│ ├─── xlock.html # Page
│ ├─── config.html # Settings
│ ├─── login.html # Authorization
│ ├──── css/         
│ │ │ └─── styles.css # Basic styles
│ ├─── config/          
│ │ │ └──── xlock.json # Configuration file
│ └──── js/        
│ └──── app.js # Home 
│ └──── xlock.js # Page
│ └─── login.js # Authorization
│ └─── config.js # Settings 
└──── package.json # Configuration npm

#MongoDB - Database for data storage #
**Home**
- Filtering by Online/Offline and searching the database by device ID
- Enter device ID and select command
- Display device list 
- Display command and device history
**Configuration** 
- Ability to edit Ulr Lock and Url Unlock for Xlock page

#### Build Windows - loadWin loader for Windows 
  - Architecture x64.
  - Uses Windows libraries: winshell, shutil.
  - Create autorun via shortcuts in Startup folder.
  - Restart Chrome using .bat file. 
  - Recursively search for all Chrome shortcuts and overwrite them.
  - Working with temporary files via %TEMP%.

*Built-in build obfuscator in plans needs to be finalized*