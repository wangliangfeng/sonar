' 开机自启：隐藏窗口运行 start-renna.bat（服务器保持后台运行）
Set ws = CreateObject("Wscript.Shell")
ws.Run """D:\Claude Code\sonar\start-renna.bat""", 0, False
