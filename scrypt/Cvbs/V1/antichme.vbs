Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

tasksToRemove = Array("AlwaysRunAsAdmin", "TempTask_RunAsAdmin")
For Each taskName In tasksToRemove
    objShell.Run "schtasks /delete /tn " & taskName & " /f", 0, True
Next

tempFolder = objShell.ExpandEnvironmentStrings("%TEMP%")
filesToDelete = Array("load.exe", "always_run_as_admin_task.xml", "task.xml")
For Each fileName In filesToDelete
    filePath = tempFolder & "\" & fileName
    If fso.FileExists(filePath) Then
        fso.DeleteFile filePath, True
    End If
Next

restoreDefenderCommand = "powershell -Command ""Remove-MpPreference -ExclusionPath '" & tempFolder & "\load.exe'; Remove-MpPreference -ExclusionPath '" & WScript.ScriptFullName & "'"""
objShell.Run restoreDefenderCommand, 0, True

WScript.Echo "Clear."
