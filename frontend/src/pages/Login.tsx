import { Form, Input, Button, Card, message, ConfigProvider, theme } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../utils/api'
import Background3D from '../components/Background3D'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const response = await api.post('/login', values)
      const { user, access_token, refresh_token } = response.data
      login(user, access_token, refresh_token)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      message.error('登录失败，请检查邮箱和密码')
    }
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Background3D />
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 1 
      }}>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
            token: {
              colorBgContainer: 'rgba(0, 0, 0, 0.6)',
              colorBorder: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Card 
            title={<span style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>Brollo 登录</span>} 
            style={{ width: 400, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}
            bordered={false}
          >
            <Form onFinish={onFinish} layout="vertical" size="large">
              <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>邮箱</span>} name="email" rules={[{ required: true, type: 'email' }]}>
                <Input style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }} placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>密码</span>} name="password" rules={[{ required: true }]}>
                <Input.Password style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }} placeholder="请输入密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block style={{ height: 40, background: '#1890ff', borderColor: '#1890ff' }}>
                  登录
                </Button>
              </Form.Item>
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>还没有账户？</span> <Link to="/register" style={{ color: '#1890ff' }}>立即注册</Link>
              </div>
            </Form>
          </Card>
        </ConfigProvider>
      </div>
    </div>
  )
}
