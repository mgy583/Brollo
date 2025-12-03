import { Card, Form, Input, Button, message, Divider } from 'antd'
import { useAuthStore } from '../stores/authStore'
import api from '../utils/api'

export default function Settings() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const onProfileFinish = async (values: any) => {
    try {
      const response = await api.put('/profile', values)
      updateUser(response.data)
      message.success('更新成功')
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败')
    }
  }

  const onPasswordFinish = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的密码不一致')
      return
    }
    
    try {
      await api.put('/profile/password', {
        old_password: values.old_password,
        new_password: values.new_password,
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error: any) {
      message.error(error.response?.data?.error || '密码修改失败')
    }
  }

  return (
    <div>
      <h1>设置</h1>

      <Card title="个人信息" style={{ marginTop: 16, maxWidth: 600 }}>
        <Form
          form={profileForm}
          onFinish={onProfileFinish}
          layout="vertical"
          initialValues={{
            username: user?.username,
            email: user?.email,
          }}
        >
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
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

        <Divider />

        <h3>修改密码</h3>
        <Form
          form={passwordForm}
          onFinish={onPasswordFinish}
          layout="vertical"
        >
          <Form.Item 
            label="当前密码" 
            name="old_password"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item 
            label="新密码" 
            name="new_password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item 
            label="确认新密码" 
            name="confirm_password"
            rules={[{ required: true, message: '请确认新密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="系统信息" style={{ marginTop: 16, maxWidth: 600 }}>
        <p><strong>用户名:</strong> {user?.username}</p>
        <p><strong>邮箱:</strong> {user?.email}</p>
      </Card>
    </div>
  )
}
