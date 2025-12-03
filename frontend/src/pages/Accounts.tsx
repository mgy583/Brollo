import { Table, Button, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'

export default function Accounts() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/accounts', values),
    onSuccess: () => {
      message.success('创建成功')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const columns = [
    { title: '账户名称', dataIndex: 'name', key: 'name' },
    { title: '账户类型', dataIndex: 'account_type', key: 'account_type' },
    { title: '余额', dataIndex: 'current_balance', key: 'current_balance', render: (val: number) => `¥${val?.toFixed(2) || '0.00'}` },
    { title: '货币', dataIndex: 'currency', key: 'currency' },
    { title: '状态', dataIndex: 'status', key: 'status' },
  ]

  const handleSubmit = async (values: any) => {
    const data = {
      name: values.name,
      account_type: values.account_type,
      currency: values.currency,
      initial_balance: parseFloat(values.balance) || 0,
      current_balance: parseFloat(values.balance) || 0,
      is_excluded_from_total: false,
      status: 'active',
    }
    createMutation.mutate(data)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>账户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新建账户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data?.items || []}
        loading={isLoading}
        rowKey="_id"
        pagination={{
          total: data?.data?.pagination?.total || 0,
          pageSize: data?.data?.pagination?.page_size || 10,
          current: data?.data?.pagination?.page || 1,
        }}
      />

      <Modal
        title="新建账户"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="账户名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="账户类型" name="account_type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="bank">银行账户</Select.Option>
              <Select.Option value="cash">现金</Select.Option>
              <Select.Option value="credit_card">信用卡</Select.Option>
              <Select.Option value="investment">投资账户</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="初始余额" name="balance" initialValue={0}>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="货币" name="currency" initialValue="CNY">
            <Select>
              <Select.Option value="CNY">人民币</Select.Option>
              <Select.Option value="USD">美元</Select.Option>
              <Select.Option value="EUR">欧元</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
