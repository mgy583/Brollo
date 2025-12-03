import { Card, Form, Input, Button, message } from 'antd'
import { useAuthStore } from '../stores/authStore'
import api from '../utils/api'

export default function Settings() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const onFinish = async (values: any) => {
    try {
      const response = await api.put('/profile', values)
      updateUser(response.data)
      message.success('更新成功')
    } catch {
      message.error('更新失败')
    }
  }

  return (
    <div>
      <h1>设置</h1>

      <Card title="个人信息" style={{ marginTop: 16, maxWidth: 600 }}>
        <Form
          onFinish={onFinish}
          layout="vertical"
          initialValues={{
            username: user?.username,
            email: user?.email,
          }}
        >
          <Form.Item label="用户名" name="username">
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input disabled />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
