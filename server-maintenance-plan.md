# 🖥️ Claw服务器维护计划

## 📋 服务器基本信息

### 硬件配置
- **主机名**: WIN-20260312NTI
- **IP地址**: 192.168.3.173 (建议设置为静态IP)
- **操作系统**: Windows 10/11
- **用途**: Claw项目专用服务器

### 服务配置
| 服务 | 端口 | 用途 | 状态 |
|------|------|------|------|
| 共享服务器 | 8082 | 项目文件共享 | ✅ 运行中 |
| 后端API | 8089 | Claw后端服务 | 🔄 可启动 |
| 支付测试 | 8090 | 支付测试服务 | 🔄 可启动 |
| 远程桌面 | 3389 | 远程管理 | ⚠️ 需配置 |

## 🚀 服务器优化配置

### 1. 网络配置
```powershell
# 设置静态IP（推荐）
netsh interface ip set address "以太网" static 192.168.3.200 255.255.255.0 192.168.3.1
netsh interface ip set dns "以太网" static 8.8.8.8
netsh interface ip add dns "以太网" 8.8.4.4 index=2

# 防火墙规则
New-NetFirewallRule -DisplayName "Claw-Services" -Direction Inbound -LocalPort 8082,8089,8090 -Protocol TCP -Action Allow
```

### 2. 电源管理
```powershell
# 禁用休眠和睡眠
powercfg -change -standby-timeout-ac 0
powercfg -change -hibernate-timeout-ac 0
powercfg -change -monitor-timeout-ac 0
powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c  # 高性能模式
```

### 3. 自动启动配置
```powershell
# 创建计划任务（开机自启动）
schtasks /create /tn "ClawServerAutoStart" /tr "python \"C:\Users\Administrator\WorkBuddy\Claw\ultra-simple-share.py\"" /sc onstart /ru SYSTEM /rl HIGHEST /f
```

## 🔧 日常维护任务

### 每日检查
```powershell
# 使用管理脚本检查状态
.\server-manager.ps1 -Action status

# 检查磁盘空间
Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}, @{Name="FreePercent";Expression={[math]::Round(($_.FreeSpace/$_.Size)*100,2)}}
```

### 每周维护
1. **清理日志文件**
   ```powershell
   # 清理超过30天的日志
   Get-ChildItem *.log -Recurse | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
   ```

2. **检查更新**
   ```powershell
   # Windows更新
   Get-WindowsUpdateLog
   
   # Python包更新
   python -m pip list --outdated
   ```

3. **备份重要数据**
   ```powershell
   # 备份Claw项目
   $backupDir = "C:\Backups\Claw\$(Get-Date -Format 'yyyy-MM-dd')"
   New-Item -ItemType Directory -Path $backupDir -Force
   Copy-Item "C:\Users\Administrator\WorkBuddy\Claw\*" -Destination $backupDir -Recurse -Force
   ```

### 每月维护
1. **系统健康检查**
   ```powershell
   # 检查事件日志
   Get-EventLog -LogName System -EntryType Error -Newest 50
   
   # 检查性能计数器
   Get-Counter "\Processor(_Total)\% Processor Time", "\Memory\Available MBytes"
   ```

2. **安全扫描**
   ```powershell
   # Windows Defender扫描
   Start-MpScan -ScanType QuickScan
   ```

3. **磁盘整理**
   ```powershell
   # 优化磁盘
   Optimize-Volume -DriveLetter C -Verbose
   ```

## 📊 监控方案

### 实时监控
```powershell
# 启动监控模式
.\server-manager.ps1 -Action monitor

# 监控输出示例：
# [14:30:00] ✅ 检查 #1 - 状态: 正常
# [14:30:30] ✅ 检查 #2 - 状态: 正常
# [14:31:00] ❌ 检查 #3 - 状态: 异常
```

### 监控指标
| 指标 | 正常范围 | 检查频率 | 告警阈值 |
|------|----------|----------|----------|
| CPU使用率 | < 80% | 每5分钟 | > 90% 持续5分钟 |
| 内存使用率 | < 85% | 每5分钟 | > 95% 持续5分钟 |
| 磁盘空间 | > 20% | 每小时 | < 10% |
| 网络连接 | 正常 | 每5分钟 | 端口无响应 |
| 服务状态 | 运行中 | 每1分钟 | 服务停止 |

### 告警配置
```powershell
# 创建告警脚本
$alertScript = @'
param($metric, $value, $threshold)
$message = "🚨 服务器告警 - $metric 超过阈值: $value (阈值: $threshold)"
Write-Host $message -ForegroundColor Red
# 可以添加邮件、短信等通知方式
'@
Set-Content -Path "server-alert.ps1" -Value $alertScript
```

## 🔄 备份策略

### 备份频率
- **每日**: 增量备份（项目代码、配置文件）
- **每周**: 完整备份（整个项目文件夹）
- **每月**: 系统镜像备份

### 备份位置
```
C:\Backups\
├── Claw\
│   ├── daily\          # 每日增量备份
│   ├── weekly\         # 每周完整备份
│   └── monthly\        # 每月系统备份
└── System\
    └── images\         # 系统镜像
```

### 备份脚本
```powershell
# 每日备份脚本
$backupDir = "C:\Backups\Claw\daily\$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Path $backupDir -Force

# 备份修改过的文件
$sourceDir = "C:\Users\Administrator\WorkBuddy\Claw"
$lastBackup = Get-Date (Get-ChildItem "C:\Backups\Claw\daily" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName

Get-ChildItem $sourceDir -Recurse -File | Where-Object {
    $_.LastWriteTime -gt $lastBackup
} | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length + 1)
    $destPath = Join-Path $backupDir $relativePath
    $destDir = Split-Path $destPath -Parent
    New-Item -ItemType Directory -Path $destDir -Force
    Copy-Item $_.FullName -Destination $destPath -Force
}
```

## 🛡️ 安全配置

### 1. 账户安全
```powershell
# 创建专用服务账户
New-LocalUser -Name "ClawService" -Password (ConvertTo-SecureString "StrongPassword123!" -AsPlainText -Force) -FullName "Claw Service Account" -Description "Claw服务器专用账户"

# 设置密码策略
net accounts /minpwlen:12 /maxpwage:90 /minpwage:1 /uniquepw:5
```

### 2. 防火墙配置
```powershell
# 只开放必要端口
New-NetFirewallRule -DisplayName "Claw-HTTP" -Direction Inbound -LocalPort 8082 -Protocol TCP -Action Allow -RemoteAddress 192.168.3.0/24

# 禁用不必要的服务
Get-Service | Where-Object {$_.StartType -eq "Automatic" -and $_.Name -notin @("EventLog", "Dnscache", "RpcSs")} | Set-Service -StartupType Manual
```

### 3. 日志审计
```powershell
# 启用安全审计
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
auditpol /set /subcategory:"Object Access" /success:enable /failure:enable

# 配置事件日志大小
wevtutil sl Security /ms:104857600  # 100MB
wevtutil sl System /ms:52428800     # 50MB
wevtutil sl Application /ms:52428800 # 50MB
```

## 🚨 故障恢复

### 常见问题处理

#### 1. 服务器无法启动
```powershell
# 检查端口占用
netstat -ano | findstr :8082

# 检查Python环境
python --version
python -c "import http.server; print('OK')"

# 查看错误日志
Get-Content server-errors.log -Tail 50
```

#### 2. 网络连接问题
```powershell
# 测试网络连通性
Test-NetConnection -ComputerName 192.168.3.173 -Port 8082

# 检查防火墙
Get-NetFirewallRule -DisplayName "Claw*" | Format-Table DisplayName, Enabled, Direction, Action

# 重置网络
netsh winsock reset
netsh int ip reset
```

#### 3. 性能问题
```powershell
# 查看资源使用情况
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
Get-Process | Sort-Object WS -Descending | Select-Object -First 10

# 检查磁盘性能
Get-PhysicalDisk | Get-StorageReliabilityCounter | Select-Object Wear, Temperature, ReadErrorsTotal, WriteErrorsTotal
```

### 恢复步骤
1. **尝试重启服务**
   ```powershell
   .\server-manager.ps1 -Action restart
   ```

2. **检查系统资源**
   ```powershell
   .\server-manager.ps1 -Action status
   ```

3. **查看日志分析**
   ```powershell
   Get-Content server-status.log -Tail 100
   Get-EventLog -LogName Application -Source Python -Newest 20
   ```

4. **恢复备份**
   ```powershell
   # 从最新备份恢复
   $latestBackup = Get-ChildItem "C:\Backups\Claw\weekly" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
   Copy-Item "$($latestBackup.FullName)\*" -Destination "C:\Users\Administrator\WorkBuddy\Claw" -Recurse -Force
   ```

## 📈 性能优化

### 1. 系统优化
```powershell
# 调整TCP参数
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global rss=enabled

# 调整电源计划
powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c  # 高性能
```

### 2. 服务优化
```powershell
# 调整Python服务器参数
$pythonConfig = @"
# 增加工作线程数
import socketserver
socketserver.TCPServer.request_queue_size = 100
"@
```

### 3. 监控优化
```powershell
# 配置性能计数器
$counters = @(
    "\Processor(_Total)\% Processor Time",
    "\Memory\Available MBytes", 
    "\LogicalDisk(C:)\% Free Space",
    "\Network Interface(*)\Bytes Total/sec"
)

# 创建数据收集器
logman create counter PerfMonitor -o "C:\PerfLogs\ClawServer.blg" -f bincirc -v mmddhhmm -max 250 -c $counters -si 00:01:00
```

## 📝 文档管理

### 服务器文档
- **SERVER-INFO.md** - 服务器基本信息
- **server-maintenance-plan.md** - 本维护计划
- **network-config.md** - 网络配置文档
- **backup-procedure.md** - 备份流程文档
- **recovery-plan.md** - 灾难恢复计划

### 变更记录
```markdown
## 变更日志

### 2026-04-22
- ✅ 初始服务器配置
- ✅ 共享服务部署（端口8082）
- ✅ 管理脚本创建
- ✅ 维护计划制定

### 计划中的变更
- 🔄 设置静态IP地址
- 🔄 配置远程桌面访问
- 🔄 部署监控告警系统
- 🔄 实施定期备份策略
```

## 🎯 总结

### 当前状态
- ✅ 共享服务器运行正常（端口8082）
- ✅ 管理工具就绪
- ✅ 维护计划制定
- ✅ 备份策略规划

### 下一步行动
1. **立即执行**：
   - 设置静态IP地址
   - 配置强密码保护
   - 测试备份脚本

2. **短期计划**：
   - 部署监控系统
   - 配置自动备份
   - 优化安全设置

3. **长期规划**：
   - 实施高可用方案
   - 部署负载均衡
   - 建立灾备中心

### 联系方式
- **服务器位置**: 当前电脑
- **管理工具**: `server-manager.ps1`
- **监控地址**: http://192.168.3.173:8082
- **文档位置**: C:\Users\Administrator\WorkBuddy\Claw\

---

**最后更新**: 2026-04-22  
**版本**: v1.0  
**状态**: 🟢 运行正常  
**维护负责人**: 系统管理员