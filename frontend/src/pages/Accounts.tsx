import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'

export default function Accounts() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<any>({})

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', filters],
    queryFn: () => api.get('/accounts', { params: filters }),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/accounts', values),
    onSuccess: () => {
      message.success('创建成功')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: any) => api.put(`/accounts/${id}`, values),
    onSuccess: () => {
      message.success('更新成功')
      setIsModalOpen(false)
      setEditingAccount(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '删除失败')
    },
  })

  const handleEdit = (record: any) => {
    setEditingAccount(record)
    form.setFieldsValue({
      name: record.name,
      account_type: record.account_type,
      currency: record.currency,
      status: record.status,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const columns = [
    { title: '账户名称', dataIndex: 'name', key: 'name' },
    { title: '账户类型', dataIndex: 'account_type', key: 'account_type' },
    { title: '余额', dataIndex: 'current_balance', key: 'current_balance', render: (val: number) => `¥${val?.toFixed(2) || '0.00'}` },
    { title: '货币', dataIndex: 'currency', key: 'currency' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个账户吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleSubmit = async (values: any) => {
    if (editingAccount) {
      // 编辑模式
      const data = {
        name: values.name,
        account_type: values.account_type,
        currency: values.currency,
        status: values.status || 'active',
      }
      updateMutation.mutate({ id: editingAccount._id, values: data })
    } else {
      // 创建模式
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
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingAccount(null)
    form.resetFields()
  }

  const handleSearch = (values: any) => {
    const searchFilters: any = {}
    if (values.name) searchFilters.name = values.name
    if (values.account_type) searchFilters.account_type = values.account_type
    if (values.currency) searchFilters.currency = values.currency
    setFilters(searchFilters)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>账户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新建账户
        </Button>
      </div>

      <Card title="搜索筛选" style={{ marginBottom: 16 }}>
        <Form form={searchForm} onFinish={handleSearch} layout="inline">
          <Form.Item name="name" label="账户名称">
            <Input placeholder="输入账户名称" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="account_type" label="账户类型">
            <Select placeholder="选择类型" style={{ width: 150 }} allowClear>
              <Select.Option value="savings">储蓄账户</Select.Option>
              <Select.Option value="checking">支票账户</Select.Option>
              <Select.Option value="credit_card">信用卡</Select.Option>
              <Select.Option value="investment">投资账户</Select.Option>
              <Select.Option value="cash">现金</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="currency" label="货币">
            <Select placeholder="选择货币" style={{ width: 120 }} allowClear>
              <Select.Option value="CNY">人民币</Select.Option>
              <Select.Option value="USD">美元</Select.Option>
              <Select.Option value="EUR">欧元</Select.Option>
              <Select.Option value="GBP">英镑</Select.Option>
              <Select.Option value="JPY">日元</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

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
        title={editingAccount ? '编辑账户' : '新建账户'}
        open={isModalOpen}
        onCancel={handleModalClose}
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
          {!editingAccount && (
            <Form.Item label="初始余额" name="balance" initialValue={0}>
              <Input type="number" />
            </Form.Item>
          )}
          <Form.Item label="货币" name="currency" initialValue="CNY">
            <Select>
              <Select.Option value="CNY">人民币</Select.Option>
              <Select.Option value="USD">美元</Select.Option>
              <Select.Option value="EUR">欧元</Select.Option>
            </Select>
          </Form.Item>
          {editingAccount && (
            <Form.Item label="状态" name="status" initialValue="active">
              <Select>
                <Select.Option value="active">活跃</Select.Option>
                <Select.Option value="inactive">停用</Select.Option>
                <Select.Option value="closed">关闭</Select.Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending || updateMutation.isPending}>
              {editingAccount ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
