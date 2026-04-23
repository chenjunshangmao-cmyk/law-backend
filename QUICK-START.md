# 🚀 Claw服务器快速启动指南

## 📋 一分钟上手

### 1. 启动服务器
```powershell
# 方法1：使用Python脚本（最简单）
python ultra-simple-share.py

# 方法2：使用管理脚本（推荐）
.\server-manager.ps1 -Action start

# 方法3：使用批处理文件
start-python-share.bat
```

### 2. 访问服务器
```
🌐 本机访问: http://localhost:8082
📱 局域网访问: http://192.168.3.173:8082
```

### 3. 管理服务器
```powershell
# 查看状态
.\server-manager.ps1 -Action status

# 停止服务器
.\server-manager.ps1 -Action stop

# 重启服务器
.\server-manager.ps1 -Action restart

# 监控模式
.\server-manager.ps1 -Action monitor
```

## 🎯 核心功能

### 文件共享服务
- **端口**: 8082
- **功能**: 共享整个Claw项目文件夹
- **访问**: 浏览器打开即可浏览文件

### 快速链接
| 用途 | 地址 |
|------|------|
| 项目首页 | `http://192.168.3.173:8082/` |
| 前端项目 | `http://192.168.3.173:8082/frontend/` |
| 后端API | `http://192.168.3.173:8082/backend/` |
| AI测试页 | `http://192.168.3.173:8082/test-ai-access.html` |
| 服务器信息 | `http://192.168.3.173:8082/SERVER-INFO.md` |

## ⚡ 常用命令

### 服务器管理
```powershell
# 一键启动所有服务
.\server-setup.bat

# 查看详细状态
.\server-manager.ps1 -Action status

# 实时监控
.\server-manager.ps1 -Action monitor

# 查看配置
.\server-manager.ps1 -Action config
```

### 系统检查
```powershell
# 检查端口占用
netstat -ano | findstr :8082

# 检查Python进程
tasklist | findstr python

# 检查磁盘空间
wmic logicaldisk get size,freespace,caption

# 检查网络连接
ping 192.168.3.173
```

## 🔧 故障排除

### 问题1：端口被占用
```powershell
# 查看占用进程
netstat -ano | findstr :8082

# 终止进程（谨慎使用）
taskkill /F /PID [进程ID]

# 或修改端口（编辑ultra-simple-share.py第9行）
# PORT = 8083  # 改为其他端口
```

### 问题2：无法访问
```powershell
# 检查防火墙
Get-NetFirewallRule -DisplayName "Claw*"

# 测试本地访问
curl http://localhost:8082

# 检查Python是否运行
python --version
```

### 问题3：服务器停止响应
```powershell
# 强制停止所有Python进程
taskkill /F /IM python.exe

# 重新启动
.\server-manager.ps1 -Action restart

# 查看错误日志
Get-Content server-errors.log -Tail 50
```

## 📊 状态检查清单

### 正常状态指标
- ✅ Python进程运行中
- ✅ 端口8082监听中
- ✅ 可以访问 http://localhost:8082
- ✅ 文件列表正常显示
- ✅ 日志文件正常更新

### 快速诊断
```powershell
# 运行诊断脚本
$diagnosis = @()
$diagnosis += "1. Python版本: $(python --version 2>&1)"
$diagnosis += "2. 端口状态: $(if (netstat -ano | findstr :8082) {'✅ 监听中'} else {'❌ 未监听'})"
$diagnosis += "3. 进程状态: $(if (tasklist | findstr python) {'✅ 运行中'} else {'❌ 未运行'})"
$diagnosis += "4. 本地访问: $(try {Invoke-WebRequest -Uri 'http://localhost:8082' -TimeoutSec 3; '✅ 正常'} catch {'❌ 失败'})"
$diagnosis
```

## 🛠️ 工具说明

### 主要工具文件
| 文件 | 用途 | 使用方式 |
|------|------|----------|
| `ultra-simple-share.py` | Python共享服务器 | `python ultra-simple-share.py` |
| `server-manager.ps1` | PowerShell管理工具 | `.\server-manager.ps1 -Action [命令]` |
| `server-setup.bat` | 一键配置脚本 | 以管理员身份运行 |
| `start-python-share.bat` | 快速启动脚本 | 双击运行 |

### 辅助文件
| 文件 | 用途 |
|------|------|
| `SERVER-INFO.md` | 服务器配置信息 |
| `server-maintenance-plan.md` | 维护计划 |
| `test-ai-access.html` | AI访问测试页面 |
| `局域网共享说明.md` | 详细技术文档 |

## 🎮 使用场景示例

### 场景1：快速共享给团队
```powershell
# 1. 启动服务器
.\server-manager.ps1 -Action start

# 2. 获取访问地址
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}).IPAddress
Write-Host "🌐 团队访问地址: http://$ip`:8082"

# 3. 分享给团队成员
```

### 场景2：监控服务器运行
```powershell
# 启动监控模式（实时显示状态）
.\server-manager.ps1 -Action monitor

# 输出示例：
# [14:30:00] ✅ 检查 #1 - 状态: 正常
# [14:30:30] ✅ 检查 #2 - 状态: 正常
# 按 Ctrl+C 退出监控
```

### 场景3：定期维护
```powershell
# 每周维护脚本
.\server-manager.ps1 -Action status
Get-ChildItem *.log | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item
Write-Host "✅ 维护完成"
```

## ⚠️ 重要提醒

### 安全注意事项
1. **仅限内网**：不要将服务器暴露到公网
2. **强密码**：设置复杂的系统密码
3. **定期备份**：重要数据定期备份
4. **访问控制**：考虑添加基础认证

### 性能优化建议
1. **静态IP**：为服务器设置固定IP地址
2. **电源设置**：禁用休眠和睡眠
3. **防火墙**：只开放必要端口
4. **监控**：定期检查服务器状态

### 备份策略
```powershell
# 简单备份命令
$backupDir = "C:\Backups\Claw\$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Path $backupDir -Force
Copy-Item "C:\Users\Administrator\WorkBuddy\Claw\*" -Destination $backupDir -Recurse
```

## 📞 技术支持

### 获取帮助
1. **查看日志**：`server-status.log`, `server-errors.log`
2. **检查状态**：`.\server-manager.ps1 -Action status`
3. **测试连接**：浏览器访问 `http://localhost:8082`
4. **查阅文档**：`SERVER-INFO.md`, `server-maintenance-plan.md`

### 紧急恢复
```powershell
# 如果一切都不工作，尝试：
1. 重启电脑
2. 以管理员身份运行 server-setup.bat
3. 运行 .\server-manager.ps1 -Action start
4. 访问 http://localhost:8082 测试
```

## 🎉 开始使用！

### 第一步：启动服务器
```powershell
cd C:\Users\Administrator\WorkBuddy\Claw
.\server-manager.ps1 -Action start
```

### 第二步：验证访问
打开浏览器访问：
```
http://localhost:8082
```

### 第三步：分享地址
告诉团队成员访问：
```
http://192.168.3.173:8082
```

### 第四步：开始协作
- AI设备：访问项目文件进行分析
- 开发人员：查看最新代码
- 设计师：获取UI资源
- 产品经理：查看功能实现

---

**提示**：服务器会持续运行，直到手动停止。按 `Ctrl+C` 停止服务器，或使用 `.\server-manager.ps1 -Action stop`。

**当前状态**：🟢 运行正常  
**访问地址**：http://192.168.3.173:8082  
**管理工具**：`server-manager.ps1`  
**文档位置**：当前文件夹