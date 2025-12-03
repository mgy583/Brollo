import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Space, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import api from '../utils/api'

const { RangePicker } = DatePicker

// 预定义分类
const EXPENSE_CATEGORIES = [
  { value: 'shopping', label: '购物' },
  { value: 'transport', label: '交通' },
  { value: 'dining', label: '餐饮' },
  { value: 'entertainment', label: '娱乐' },
  { value: 'housing', label: '居住' },
  { value: 'healthcare', label: '医疗' },
  { value: 'education', label: '教育' },
  { value: 'utilities', label: '水电煤' },
  { value: 'communication', label: '通讯' },
  { value: 'clothing', label: '服饰' },
  { value: 'other_expense', label: '其他支出' }
]

const INCOME_CATEGORIES = [
  { value: 'salary', label: '工资' },
  { value: 'investment', label: '投资收益' },
  { value: 'bonus', label: '奖金' },
  { value: 'gift', label: '礼金' },
  { value: 'refund', label: '退款' },
  { value: 'other_income', label: '其他收入' }
]

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

export default function Transactions() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<any>({})

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => api.get('/transactions', { params: filters }),
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

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: any) => api.put(`/transactions/${id}`, values),
    onSuccess: () => {
      message.success('更新成功')
      setIsModalOpen(false)
      setEditingTransaction(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '删除失败')
    },
  })

  const handleEdit = (record: any) => {
    setEditingTransaction(record)
    form.setFieldsValue({
      account_id: record.account_id,
      transaction_type: record.transaction_type,
      amount: record.amount,
      currency: record.currency,
      date: dayjs(record.transaction_date),
      category_id: record.category_id,
      description: record.description,
      status: record.status,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const columns = [
    { title: '日期', dataIndex: 'transaction_date', key: 'transaction_date', render: (val: string) => dayjs(val).format('YYYY-MM-DD') },
    { title: '类型', dataIndex: 'transaction_type', key: 'transaction_type' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (val: number) => `¥${val.toFixed(2)}` },
    { 
      title: '分类', 
      dataIndex: 'category_id', 
      key: 'category_id',
      render: (val: string) => {
        const category = ALL_CATEGORIES.find(c => c.value === val)
        return category ? category.label : val
      }
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条交易吗？"
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

  const accounts = accountsData?.data?.items || []

  const handleSubmit = async (values: any) => {
    const data = {
      account_id: values.account_id,
      category_id: values.category_id,
      transaction_type: values.transaction_type,
      amount: parseFloat(values.amount),
      currency: values.currency || 'CNY',
      transaction_date: values.date.toISOString(),
      status: values.status || 'completed',
      description: values.description,
    }
    
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction._id, values: data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
    form.resetFields()
  }

  const handleSearch = (values: any) => {
    const searchFilters: any = {}
    if (values.transaction_type) searchFilters.transaction_type = values.transaction_type
    if (values.account_id) searchFilters.account_id = values.account_id
    if (values.category_id) searchFilters.category_id = values.category_id
    if (values.dateRange) {
      searchFilters.start_date = values.dateRange[0].toISOString()
      searchFilters.end_date = values.dateRange[1].toISOString()
    }
    setFilters(searchFilters)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>交易记录</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新建交易
        </Button>
      </div>

      <Card title="搜索筛选" style={{ marginBottom: 16 }}>
        <Form form={searchForm} onFinish={handleSearch} layout="inline">
          <Form.Item name="transaction_type" label="交易类型">
            <Select placeholder="选择类型" style={{ width: 120 }} allowClear>
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">支出</Select.Option>
              <Select.Option value="transfer">转账</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="account_id" label="账户">
            <Select placeholder="选择账户" style={{ width: 150 }} allowClear>
              {(accountsData?.data?.items || []).map((account: any) => (
                <Select.Option key={account._id} value={account._id}>
                  {account.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="category_id" label="分类">
            <Select placeholder="选择分类" style={{ width: 150 }} allowClear>
              {ALL_CATEGORIES.map(cat => (
                <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
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
        title={editingTransaction ? '编辑交易' : '新建交易'}
        open={isModalOpen}
        onCancel={handleModalClose}
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
          <Form.Item label="分类" name="category_id" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="选择分类">
              <Select.OptGroup label="支出分类">
                {EXPENSE_CATEGORIES.map(cat => (
                  <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
                ))}
              </Select.OptGroup>
              <Select.OptGroup label="收入分类">
                {INCOME_CATEGORIES.map(cat => (
                  <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea />
          </Form.Item>
          {editingTransaction && (
            <Form.Item label="状态" name="status">
              <Select>
                <Select.Option value="pending">待处理</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
                <Select.Option value="cancelled">已取消</Select.Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending || updateMutation.isPending}>
              {editingTransaction ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
