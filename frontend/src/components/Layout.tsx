import { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Button, Space, Typography } from 'antd'
import { PieChartOutlined, WalletOutlined, TransactionOutlined, BarChartOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const { Header, Sider, Content } = AntLayout
const { Text } = Typography

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Theme switching removed; we use Element-like theme globally.

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed} 
        theme="light" 
        width={240}
        style={{ 
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)', 
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ 
            marginBottom: 16, 
            fontSize: 24, 
            fontWeight: 800, 
            background: 'linear-gradient(45deg, #1890ff, #00d2ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            {collapsed ? 'B' : 'Brollo'}
          </div>
          <div style={{ display: 'inline-block', padding: 4, borderRadius: '50%', border: '2px solid #f0f0f0' }}>
            <Avatar size={56} src={user?.avatar} style={{ backgroundColor: '#1890ff' }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </div>
        </div>
        <div style={{ padding: '0 12px 24px', textAlign: 'center' }}>
          <Text strong style={{ fontSize: 16 }}>{user?.username || user?.email || '访客'}</Text>
        </div>
        <Menu 
          mode="inline" 
          defaultSelectedKeys={[window.location.pathname.replace('/', '') || '']}
          style={{ background: 'transparent', borderRight: 'none' }}
          items={[
            { key: '', icon: <PieChartOutlined />, label: <NavLink to="/">仪表盘</NavLink> },
            { key: 'accounts', icon: <WalletOutlined />, label: <NavLink to="/accounts">账户</NavLink> },
            { key: 'transactions', icon: <TransactionOutlined />, label: <NavLink to="/transactions">交易</NavLink> },
            { key: 'budgets', icon: <BarChartOutlined />, label: <NavLink to="/budgets">预算</NavLink> },
            { key: 'reports', icon: <BarChartOutlined />, label: <NavLink to="/reports">报表</NavLink> },
            { key: 'settings', icon: <SettingOutlined />, label: <NavLink to="/settings">设置</NavLink> },
          ]}
        />
      </Sider>

      <AntLayout style={{ background: 'transparent' }}>
        <Header style={{ 
          background: 'rgba(255, 255, 255, 0.6)', 
          backdropFilter: 'blur(10px)',
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          height: 64,
          position: 'sticky',
          top: 0,
          zIndex: 9
        }}>
          <Space size="middle">
            <Button type="text" onClick={() => navigate('/settings')}>个人设置</Button>
            <Button type="primary" danger ghost icon={<LogoutOutlined />} onClick={handleLogout}>登出</Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px', overflow: 'initial' }}>
          <div style={{ 
            padding: 24, 
            background: 'rgba(255, 255, 255, 0.9)', 
            borderRadius: 16, 
            minHeight: 360,
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

