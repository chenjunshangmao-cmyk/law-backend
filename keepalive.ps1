# Claw 后端保活脚本
# 检查后端是否运行，如果挂了自动重启
# 可以用任务计划程序每5分钟执行一次

$port = 8089
$backendDir = "C:\Users\Administrator\WorkBuddy\Claw\backend"
$logFile = "C:\Users\Administrator\WorkBuddy\Claw\backend\keepalive.log"

function Log($msg) {
  $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$time $msg" | Out-File -Append -FilePath $logFile
  Write-Host "$time $msg"
}

# 检查端口是否监听
$listener = $null
try {
  $tcp = New-Object System.Net.Sockets.TcpClient
  $async = $tcp.BeginConnect("127.0.0.1", $port, $null, $null)
  $wait = $async.AsyncWaitHandle.WaitOne(2000, $false)
  if ($wait -and $tcp.Connected) {
    $tcp.EndConnect($async) | Out-Null
    $tcp.Close()
    # 端口监听中，检查API是否健康
    try {
      $res = Invoke-RestMethod -Uri "http://localhost:$port/api/health" -TimeoutSec 3
      if ($res.status -eq "healthy") {
        exit 0  # 一切正常
      }
    } catch {
      Log "⚠️ 端口在监听但API不健康，将重启"
    }
  } else {
    Log "⚠️ 端口 $port 未监听"
  }
} catch {
  Log "⚠️ 检查失败: $_"
} finally {
  if ($tcp) { $tcp.Close() }
}

# 到这里说明需要重启
Log "🔄 正在重启后端服务..."

# 杀旧进程
$oldPids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
foreach ($pid in $oldPids) {
  try { Stop-Process -Id $pid -Force; Log "  Kill PID $pid" } catch {}
}
Start-Sleep -Seconds 2

# 启动后端
try {
  $process = Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory $backendDir -NoNewWindow -PassThru -RedirectStandardOutput "$backendDir\output.log" -RedirectStandardError "$backendDir\error.log"
  Log "✅ 后端已启动，PID: $($process.Id)"
  
  # 等待启动
  Start-Sleep -Seconds 5
  
  # 验证
  try {
    $res = Invoke-RestMethod -Uri "http://localhost:$port/api/health" -TimeoutSec 3
    Log "✅ 后端健康检查通过: $($res.status)"
  } catch {
    Log "⚠️ 启动后健康检查失败: $_"
  }
} catch {
  Log "❌ 启动失败: $_"
}
