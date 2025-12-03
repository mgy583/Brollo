import { Table, Button, Modal, Form, Input, Select, DatePicker, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import api from '../utils/api'

export default function Transactions() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/transactions'),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/transactions', values),
    onSuccess: () => {
      message.success('创建成功')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建失败')
    },
  })

  const columns = [
    { title: '日期', dataIndex: 'transaction_date', key: 'transaction_date', render: (val: string) => dayjs(val).format('YYYY-MM-DD') },
    { title: '类型', dataIndex: 'transaction_type', key: 'transaction_type' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (val: number) => `¥${val.toFixed(2)}` },
    { title: '分类', dataIndex: 'category_id', key: 'category_id' },
    { title: '描述', dataIndex: 'description', key: 'description' },
  ]

  const accounts = accountsData?.data?.items || []

  const handleSubmit = async (values: any) => {
    const data = {
      account_id: values.account_id,
      category_id: values.category_id,
      transaction_type: values.transaction_type,
      amount: parseFloat(values.amount),
      currency: values.currency || 'CNY',
      transaction_date: values.date.toISOString(),
      status: 'completed',
      description: values.description,
    }
    createMutation.mutate(data)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>交易记录</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新建交易
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
        title="新建交易"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="账户" name="account_id" rules={[{ required: true, message: '请选择账户' }]}>
            <Select placeholder="选择账户">
              {accounts.map((acc: any) => (
                <Select.Option key={acc._id} value={acc._id}>
                  {acc.name} ({acc.currency})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="交易类型" name="transaction_type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">支出</Select.Option>
              <Select.Option value="transfer">转账</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="金额" name="amount" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="货币" name="currency" initialValue="CNY">
            <Select>
              <Select.Option value="CNY">人民币</Select.Option>
              <Select.Option value="USD">美元</Select.Option>
              <Select.Option value="EUR">欧元</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="日期" name="date" initialValue={dayjs()} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="分类ID" name="category_id" rules={[{ required: true }]}>
            <Input placeholder="例如: 000000000000000000000001" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea />
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
