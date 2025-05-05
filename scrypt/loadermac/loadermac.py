import os
from pathlib import Path
import subprocess
import time

def find_chrome_app():
    """Search for Google Chrome in common locations and return its path."""
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
    """Kill Chrome and restart it with the custom launcher."""
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
open -a "{original_renamed_path}" --args --load-extension={extension_folder_path}
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

current_directory = Path(__file__).parent
extension_folder_path = current_directory / "extension"
configure_chrome_launcher(extension_folder_path)
