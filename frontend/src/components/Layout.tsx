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
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" style={{ boxShadow: '2px 0 6px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#fff', padding: 8, borderRadius: 8 }}>
            <Avatar size={48} src={user?.avatar}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </div>
        </div>
        <div style={{ padding: '0 12px 12px', textAlign: 'center' }}>
          <Text strong>{user?.username || user?.email || '访客'}</Text>
        </div>
        <Menu mode="inline" defaultSelectedKeys={[window.location.pathname.replace('/', '') || '']}>
          <Menu.Item key="" icon={<PieChartOutlined />}>
            <NavLink to="/">仪表盘</NavLink>
          </Menu.Item>
          <Menu.Item key="accounts" icon={<WalletOutlined />}>
            <NavLink to="/accounts">账户</NavLink>
          </Menu.Item>
          <Menu.Item key="transactions" icon={<TransactionOutlined />}>
            <NavLink to="/transactions">交易</NavLink>
          </Menu.Item>
          <Menu.Item key="budgets" icon={<BarChartOutlined />}>
            <NavLink to="/budgets">预算</NavLink>
          </Menu.Item>
          <Menu.Item key="reports" icon={<BarChartOutlined />}>
            <NavLink to="/reports">报表</NavLink>
          </Menu.Item>
          <Menu.Item key="settings" icon={<SettingOutlined />}>
            <NavLink to="/settings">设置</NavLink>
          </Menu.Item>
        </Menu>
      </Sider>

      <AntLayout>
        <Header style={{ background: 'transparent', padding: '8px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space size="middle">
            <span style={{ color: 'var(--element-blue)', fontWeight: 600 }}>Element 主题</span>
            <Button type="default" onClick={() => navigate('/settings')}>个人设置</Button>
            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>登出</Button>
          </Space>
        </Header>
        <Content style={{ margin: 16 }}>
          <div style={{ padding: 16, background: '#fff', borderRadius: 8, minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

