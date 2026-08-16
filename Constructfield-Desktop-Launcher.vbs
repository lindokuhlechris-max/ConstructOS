Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
If fso.FileExists("Constructfield-App.exe") Then
    WshShell.Run chr(34) & "Constructfield-App.exe" & chr(34), 0, False
ElseIf fso.FileExists("ConstructOS-App.exe") Then
    WshShell.Run chr(34) & "ConstructOS-App.exe" & chr(34), 0, False
Else
    WshShell.Run "cmd /c npm run dev", 0, False
End If
