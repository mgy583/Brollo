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
              colorBgContainer: 'rgba(20, 20, 20, 0.95)',
              colorBorder: 'rgba(255, 255, 255, 0.15)',
              colorText: '#fff',
              colorTextPlaceholder: 'rgba(255, 255, 255, 0.4)',
            },
            components: {
              Input: {
                activeBorderColor: 'rgba(255, 255, 255, 0.3)',
                hoverBorderColor: 'rgba(255, 255, 255, 0.25)',
                activeShadow: '0 0 0 2px rgba(24, 144, 255, 0.1)',
              },
            },
          }}
        >
          <Card 
            title={<span style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>Brollo 登录</span>} 
            style={{ 
              width: 400, 
              background: 'rgba(20, 20, 20, 0.95)',
              backdropFilter: 'blur(20px)', 
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            headStyle={{ background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            bodyStyle={{ background: 'transparent' }}
            bordered={false}
          >
            <Form onFinish={onFinish} layout="vertical" size="large">
              <Form.Item 
                label={<span style={{ color: 'rgba(255,255,255,0.9)' }}>邮箱</span>} 
                name="email" 
                rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item 
                label={<span style={{ color: 'rgba(255,255,255,0.9)' }}>密码</span>} 
                name="password" 
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  style={{ 
                    height: 44, 
                    fontSize: 16,
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    borderColor: 'transparent',
                    fontWeight: 500
                  }}
                >
                  登录
                </Button>
              </Form.Item>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>还没有账户？</span>
                {' '}
                <Link to="/register" style={{ color: '#40a9ff', fontWeight: 500 }}>立即注册</Link>
              </div>
            </Form>
          </Card>
        </ConfigProvider>
      </div>
    </div>
  )
}
