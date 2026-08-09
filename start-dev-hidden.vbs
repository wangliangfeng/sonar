' Hidden launcher for start-dev.bat (run at logon, no console window)
Set sh = CreateObject("Wscript.Shell")
sh.Run "cmd /c ""D:\Claude Code\sonar\start-dev.bat""", 0, False
