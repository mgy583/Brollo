import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../utils/api'

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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card title="登录" style={{ width: 400 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            还没有账户？ <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
