# Claw服务器管理脚本 - PowerShell版本
# 功能：启动、停止、监控Claw服务器

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "status", "restart", "monitor", "config", "help")]
    [string]$Action = "help"
)

# 配置信息
$ServerConfig = @{
    Name = "ClawServer"
    Port = 8082
    PythonScript = "ultra-simple-share.py"
    LogFile = "server-status.log"
    ErrorLog = "server-errors.log"
    BackupDir = "backups"
    MaxLogSizeMB = 10
}

# 颜色定义
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Debug = "Gray"
}

# 日志函数
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # 控制台输出
    if ($Color -ne "White") {
        Write-Host $logMessage -ForegroundColor $Color
    } else {
        Write-Host $logMessage
    }
    
    # 文件日志
    Add-Content -Path $ServerConfig.LogFile -Value $logMessage -Encoding UTF8
    
    # 错误日志
    if ($Level -eq "ERROR") {
        Add-Content -Path $ServerConfig.ErrorLog -Value $logMessage -Encoding UTF8
    }
}

# 检查管理员权限
function Test-Admin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 检查端口占用
function Test-PortInUse {
    param([int]$Port)
    
    try {
        $result = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return ($null -ne $result)
    } catch {
        return $false
    }
}

# 获取进程信息
function Get-ServerProcess {
    $processes = Get-Process python -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*$($ServerConfig.PythonScript)*"
    }
    return $processes
}

# 启动服务器
function Start-Server {
    Write-Log "正在启动Claw服务器..." "INFO" $Colors.Info
    
    # 检查端口是否被占用
    if (Test-PortInUse -Port $ServerConfig.Port) {
        Write-Log "端口 $($ServerConfig.Port) 已被占用" "ERROR" $Colors.Error
        return $false
    }
    
    # 检查Python脚本是否存在
    if (-not (Test-Path $ServerConfig.PythonScript)) {
        Write-Log "找不到Python脚本: $($ServerConfig.PythonScript)" "ERROR" $Colors.Error
        return $false
    }
    
    try {
        # 启动服务器（后台运行）
        $process = Start-Process python -ArgumentList $ServerConfig.PythonScript -WindowStyle Hidden -PassThru
        
        # 等待服务器启动
        Start-Sleep -Seconds 2
        
        # 检查是否启动成功
        if (Test-PortInUse -Port $ServerConfig.Port) {
            Write-Log "✅ 服务器启动成功！PID: $($process.Id)" "SUCCESS" $Colors.Success
            Write-Log "🌐 访问地址: http://localhost:$($ServerConfig.Port)" "INFO" $Colors.Info
            Write-Log "📁 共享路径: $(Get-Location)" "INFO" $Colors.Info
            
            # 保存进程信息
            $process | Select-Object Id, StartTime | Export-Clixml -Path ".server-process.xml"
            
            return $true
        } else {
            Write-Log "❌ 服务器启动失败，端口未监听" "ERROR" $Colors.Error
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            return $false
        }
    } catch {
        Write-Log "启动服务器时出错: $_" "ERROR" $Colors.Error
        return $false
    }
}

# 停止服务器
function Stop-Server {
    Write-Log "正在停止Claw服务器..." "INFO" $Colors.Info
    
    $processes = Get-ServerProcess
    
    if ($processes.Count -eq 0) {
        Write-Log "未找到运行的Claw服务器进程" "WARNING" $Colors.Warning
        return $true
    }
    
    $stoppedCount = 0
    foreach ($process in $processes) {
        try {
            Stop-Process -Id $process.Id -Force
            Write-Log "已停止进程: $($process.Id)" "INFO" $Colors.Info
            $stoppedCount++
        } catch {
            Write-Log "停止进程 $($process.Id) 时出错: $_" "ERROR" $Colors.Error
        }
    }
    
    if ($stoppedCount -gt 0) {
        Write-Log "✅ 已停止 $stoppedCount 个服务器进程" "SUCCESS" $Colors.Success
        return $true
    } else {
        Write-Log "❌ 未能停止任何服务器进程" "ERROR" $Colors.Error
        return $false
    }
}

# 查看服务器状态
function Get-ServerStatus {
    Write-Log "检查服务器状态..." "INFO" $Colors.Info
    
    # 检查进程
    $processes = Get-ServerProcess
    $portInUse = Test-PortInUse -Port $ServerConfig.Port
    
    Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
    Write-Host "Claw服务器状态报告" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    # 进程状态
    if ($processes.Count -gt 0) {
        Write-Host "✅ 进程状态: 运行中" -ForegroundColor Green
        foreach ($process in $processes) {
            Write-Host "   PID: $($process.Id)" -ForegroundColor White
            Write-Host "   启动时间: $($process.StartTime)" -ForegroundColor White
            Write-Host "   内存使用: $([math]::Round($process.WorkingSet64/1MB, 2)) MB" -ForegroundColor White
        }
    } else {
        Write-Host "❌ 进程状态: 未运行" -ForegroundColor Red
    }
    
    # 端口状态
    if ($portInUse) {
        Write-Host "✅ 端口状态: $($ServerConfig.Port) 监听中" -ForegroundColor Green
        
        # 获取连接信息
        $connections = Get-NetTCPConnection -LocalPort $ServerConfig.Port -ErrorAction SilentlyContinue
        if ($connections) {
            Write-Host "   活动连接: $($connections.Count)" -ForegroundColor White
        }
    } else {
        Write-Host "❌ 端口状态: $($ServerConfig.Port) 未监听" -ForegroundColor Red
    }
    
    # 访问信息
    Write-Host "`n🌐 访问信息:" -ForegroundColor Cyan
    Write-Host "   本机访问: http://localhost:$($ServerConfig.Port)" -ForegroundColor White
    Write-Host "   局域网访问: http://$(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object -First 1).IPAddress:$($ServerConfig.Port)" -ForegroundColor White
    
    # 系统信息
    Write-Host "`n🖥️ 系统信息:" -ForegroundColor Cyan
    Write-Host "   主机名: $env:COMPUTERNAME" -ForegroundColor White
    Write-Host "   CPU使用率: $(Get-WmiObject Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average%" -ForegroundColor White
    Write-Host "   可用内存: $([math]::Round((Get-WmiObject Win32_OperatingSystem).FreePhysicalMemory/1MB, 2)) GB" -ForegroundColor White
    
    Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
}

# 监控模式
function Start-Monitor {
    Write-Log "启动服务器监控模式..." "INFO" $Colors.Info
    Write-Host "监控模式已启动，按 Ctrl+C 退出" -ForegroundColor Yellow
    Write-Host "将每30秒检查一次服务器状态`n" -ForegroundColor Yellow
    
    $checkCount = 0
    $lastStatus = $null
    
    try {
        while ($true) {
            $checkCount++
            $currentTime = Get-Date -Format "HH:mm:ss"
            
            # 检查服务器状态
            $processes = Get-ServerProcess
            $portInUse = Test-PortInUse -Port $ServerConfig.Port
            
            $status = @{
                Time = $currentTime
                CheckCount = $checkCount
                ProcessRunning = ($processes.Count -gt 0)
                PortListening = $portInUse
                ProcessCount = $processes.Count
            }
            
            # 显示状态
            $statusSymbol = if ($status.ProcessRunning -and $status.PortListening) { "✅" } else { "❌" }
            $statusText = if ($status.ProcessRunning -and $status.PortListening) { "正常" } else { "异常" }
            
            Write-Host "[$currentTime] $statusSymbol 检查 #$checkCount - 状态: $statusText" -ForegroundColor $(if ($statusText -eq "正常") { "Green" } else { "Red" })
            
            if ($status.ProcessRunning -and $status.PortListening) {
                Write-Host "   进程: $($status.ProcessCount) 个, 端口: $($ServerConfig.Port) 监听中" -ForegroundColor Green
            } else {
                Write-Host "   警告: 服务器状态异常" -ForegroundColor Red
                
                # 尝试自动恢复
                if (-not $status.ProcessRunning) {
                    Write-Host "   尝试重启服务器..." -ForegroundColor Yellow
                    Start-Server | Out-Null
                }
            }
            
            # 每30秒检查一次
            Start-Sleep -Seconds 30
        }
    } catch {
        Write-Log "监控模式异常退出: $_" "ERROR" $Colors.Error
    }
}

# 服务器配置
function Show-Config {
    Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
    Write-Host "Claw服务器配置" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    foreach ($key in $ServerConfig.Keys) {
        Write-Host "  $key : $($ServerConfig[$key])" -ForegroundColor White
    }
    
    Write-Host "`n当前目录: $(Get-Location)" -ForegroundColor White
    Write-Host "Python版本: $(python --version 2>&1)" -ForegroundColor White
    
    # 检查依赖
    Write-Host "`n依赖检查:" -ForegroundColor Cyan
    $modules = @("http.server", "socketserver", "socket", "os")
    foreach ($module in $modules) {
        $test = python -c "import $module; print('OK')" 2>&1
        if ($test -like "*OK*") {
            Write-Host "  ✅ $module" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $module" -ForegroundColor Red
        }
    }
    
    Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
}

# 显示帮助
function Show-Help {
    Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
    Write-Host "Claw服务器管理工具" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    Write-Host "`n使用方法:" -ForegroundColor Yellow
    Write-Host "  .\server-manager.ps1 -Action <命令>" -ForegroundColor White
    Write-Host "  .\server-manager.ps1 start|stop|status|restart|monitor|config|help" -ForegroundColor White
    
    Write-Host "`n可用命令:" -ForegroundColor Yellow
    Write-Host "  start    启动Claw服务器" -ForegroundColor White
    Write-Host "  stop     停止Claw服务器" -ForegroundColor White
    Write-Host "  status   查看服务器状态" -ForegroundColor White
    Write-Host "  restart  重启服务器" -ForegroundColor White
    Write-Host "  monitor  启动监控模式" -ForegroundColor White
    Write-Host "  config   显示服务器配置" -ForegroundColor White
    Write-Host "  help     显示此帮助信息" -ForegroundColor White
    
    Write-Host "`n示例:" -ForegroundColor Yellow
    Write-Host "  # 启动服务器" -ForegroundColor White
    Write-Host "  .\server-manager.ps1 -Action start" -ForegroundColor White
    
    Write-Host "  # 查看状态" -ForegroundColor White
    Write-Host "  .\server-manager.ps1 -Action status" -ForegroundColor White
    
    Write-Host "  # 监控模式" -ForegroundColor White
    Write-Host "  .\server-manager.ps1 -Action monitor" -ForegroundColor White
    
    Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
    Write-Host "服务器信息:" -ForegroundColor Cyan
    Write-Host "  端口: $($ServerConfig.Port)" -ForegroundColor White
    Write-Host "  脚本: $($ServerConfig.PythonScript)" -ForegroundColor White
    Write-Host "  日志: $($ServerConfig.LogFile)" -ForegroundColor White
    Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
}

# 主程序
function Main {
    # 检查是否以管理员身份运行（某些操作需要）
    if (-not (Test-Admin) -and $Action -in @("start", "stop", "restart")) {
        Write-Host "警告: 某些操作可能需要管理员权限" -ForegroundColor Yellow
        Write-Host "建议以管理员身份运行此脚本`n" -ForegroundColor Yellow
    }
    
    # 根据动作执行相应函数
    switch ($Action) {
        "start" {
            Start-Server
        }
        "stop" {
            Stop-Server
        }
        "status" {
            Get-ServerStatus
        }
        "restart" {
            Stop-Server
            Start-Sleep -Seconds 2
            Start-Server
        }
        "monitor" {
            Start-Monitor
        }
        "config" {
            Show-Config
        }
        "help" {
            Show-Help
        }
        default {
            Show-Help
        }
    }
}

# 执行主程序
Main