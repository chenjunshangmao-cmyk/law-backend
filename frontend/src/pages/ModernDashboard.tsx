import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Globe,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Target
} from 'lucide-react';

export default function ModernDashboard() {
  const navigate = useNavigate();

  // 统计数据
  const stats = [
    {
      title: '今日销售额',
      value: '¥8,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    {
      title: '在售产品',
      value: '156',
      change: '+8',
      trend: 'up',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      title: '活跃账号',
      value: '23',
      change: '+3',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100'
    },
    {
      title: '转化率',
      value: '4.8%',
      change: '+0.6%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100'
    }
  ];

  // 平台分布
  const platforms = [
    { name: 'TikTok Shop', value: 45, color: 'bg-pink-500' },
    { name: 'OZON', value: 28, color: 'bg-blue-500' },
    { name: 'YouTube', value: 18, color: 'bg-red-500' },
    { name: '其他', value: 9, color: 'bg-gray-400' }
  ];

  // 最近订单
  const recentOrders = [
    { id: '#ORD-7821', product: '翡翠吊坠', amount: '¥2,850', platform: 'TikTok', status: '已发货', time: '2小时前' },
    { id: '#ORD-7820', product: '儿童卫衣', amount: '¥189', platform: 'OZON', status: '待发货', time: '4小时前' },
    { id: '#ORD-7819', product: '制冷配件', amount: '¥3,450', platform: 'YouTube', status: '已付款', time: '6小时前' },
    { id: '#ORD-7818', product: '翡翠手镯', amount: '¥12,800', platform: 'TikTok', status: '已完成', time: '1天前' },
    { id: '#ORD-7817', product: '儿童裤子', amount: '¥156', platform: 'OZON', status: '已发货', time: '1天前' }
  ];

  // 待办任务
  const tasks = [
    { id: 1, title: '审核新上架产品', priority: 'high', time: '今天' },
    { id: 2, title: '处理客户咨询', priority: 'medium', time: '今天' },
    { id: 3, title: '更新TikTok广告', priority: 'high', time: '明天' },
    { id: 4, title: '月度财务报告', priority: 'low', time: '本周' }
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来！👋</h1>
            <p className="text-gray-600">
              今日有 <span className="font-semibold text-blue-600">8个新订单</span> 和{' '}
              <span className="font-semibold text-emerald-600">¥8,450销售额</span>
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                <Globe size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-700">跨境运营中</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                <Zap size={16} className="text-amber-500" />
                <span className="text-sm font-medium text-gray-700">AI助手在线</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary">
              <ShoppingBag size={18} className="mr-2" />
              创建新订单
            </button>
            <button className="btn-outline">
              <Target size={18} className="mr-2" />
              查看报表
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className={`card border ${stat.borderColor} hover:shadow-lg transition-all duration-300`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                    <Icon size={20} className={stat.color} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 销售趋势 */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">销售趋势</h2>
                <p className="text-sm text-gray-500 mt-1">最近30天销售数据</p>
              </div>
              <button className="btn-outline text-sm">
                <BarChart3 size={16} className="mr-2" />
                详细报表
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center">
                <BarChart3 size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">销售图表组件</p>
                <p className="text-sm text-gray-400 mt-1">集成图表库后显示详细数据</p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">日均销售额</p>
                <p className="text-lg font-bold text-gray-900 mt-1">¥6,240</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">订单数量</p>
                <p className="text-lg font-bold text-gray-900 mt-1">42单/日</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">客单价</p>
                <p className="text-lg font-bold text-gray-900 mt-1">¥148.6</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">退货率</p>
                <p className="text-lg font-bold text-gray-900 mt-1">2.3%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 平台分布 */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">平台分布</h2>
            <p className="text-sm text-gray-500 mt-1">各平台销售占比</p>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {platforms.map((platform, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${platform.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{platform.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{platform.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${platform.color}`}
                      style={{ width: `${platform.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">总平台数</span>
                <span className="font-semibold text-gray-900">4个平台</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">覆盖国家</span>
                <span className="font-semibold text-gray-900">8个国家</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近订单 */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">最近订单</h2>
                <p className="text-sm text-gray-500 mt-1">最新5笔订单</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                查看全部 →
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="overflow-hidden">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">订单号</th>
                    <th className="table-header-cell">产品</th>
                    <th className="table-header-cell">金额</th>
                    <th className="table-header-cell">状态</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="table-row">
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{order.id}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock size={12} />
                          {order.time}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{order.product}</div>
                        <div className="text-xs text-gray-500 mt-1">{order.platform}</div>
                      </td>
                      <td className="table-cell font-semibold text-gray-900">{order.amount}</td>
                      <td className="table-cell">
                        <span className={`badge ${
                          order.status === '已完成' ? 'badge-success' :
                          order.status === '已发货' ? 'badge-primary' :
                          order.status === '已付款' ? 'badge-warning' :
                          'badge-secondary'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 待办任务 */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">待办任务</h2>
                <p className="text-sm text-gray-500 mt-1">需要处理的事项</p>
              </div>
              <button className="btn-outline text-sm">
                <Calendar size={16} className="mr-2" />
                安排日程
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${
                      task.priority === 'high' ? 'bg-red-100 text-red-600' :
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.priority === 'high' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{task.time}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {task.priority === 'high' ? '高优先级' : task.priority === 'medium' ? '中优先级' : '低优先级'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">AI建议</p>
                  <p className="text-xs text-gray-500 mt-1">根据数据分析推荐</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  查看建议 →
                </button>
              </div>
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-700">
                  💡 建议增加 TikTok 直播频次，当前转化率比其他平台高 35%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">快速操作</h2>
          <p className="text-sm text-gray-500 mt-1">常用功能快捷入口</p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-3 bg-blue-100 rounded-lg mb-3">
                <Package size={24} className="text-blue-600" />
              </div>
              <span className="font-medium text-gray-900">产品上架</span>
              <span className="text-xs text-gray-500 mt-1">快速发布新品</span>
            </button>
            
            <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-3 bg-purple-100 rounded-lg mb-3">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <span className="font-medium text-gray-900">广告投放</span>
              <span className="text-xs text-gray-500 mt-1">快速提升曝光</span>
            </button>

            <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-3 bg-green-100 rounded-lg mb-3">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <span className="font-medium text-gray-900">社媒发布</span>
              <span className="text-xs text-gray-500 mt-1">多平台一键发布</span>
            </button>
          </div>
        </div>

        {/* 快捷操作卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button onClick={() => navigate('/publish')} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="p-2 bg-blue-100 rounded-lg mb-2">
              <Zap size={20} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-800">智能发布</span>
          </button>
          <button onClick={() => navigate('/trending')} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all">
            <div className="p-2 bg-purple-100 rounded-lg mb-2">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-800">爆款选品</span>
          </button>
          <button onClick={() => navigate('/calculator')} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all">
            <div className="p-2 bg-green-100 rounded-lg mb-2">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-800">利润计算</span>
          </button>
          <button onClick={() => navigate('/accounts')} className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all">
            <div className="p-2 bg-amber-100 rounded-lg mb-2">
              <Globe size={20} className="text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-800">店铺账号</span>
          </button>
        </div>

        {/* 今日数据 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">今日订单</div>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-xs text-gray-400 mt-1">暂无数据</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">销售额</div>
            <div className="text-2xl font-bold text-green-600">¥0</div>
            <div className="text-xs text-gray-400 mt-1">暂无数据</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">产品数量</div>
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-xs text-gray-400 mt-1">暂无数据</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">AI助手</div>
            <div className="text-2xl font-bold text-amber-600">在线</div>
            <div className="text-xs text-gray-400 mt-1">随时可用</div>
          </div>
        </div>
      </div>
    </div>
  );
}