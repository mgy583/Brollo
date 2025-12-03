import { Table, Card, Progress, Button, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import api from '../utils/api'

const { RangePicker } = DatePicker

// 预定义分类（通常预算只针对支出分类）
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

export default function Budgets() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<any>(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<any>({})

  const { data, isLoading } = useQuery({
    queryKey: ['budgets', filters],
    queryFn: () => api.get('/budgets', { params: filters }),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/budgets', values),
    onSuccess: () => {
      message.success('创建成功')
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: any) => api.put(`/budgets/${id}`, values),
    onSuccess: () => {
      message.success('更新成功')
      setIsModalOpen(false)
      setEditingBudget(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '删除失败')
    },
  })

  const handleEdit = (record: any) => {
    setEditingBudget(record)
    form.setFieldsValue({
      category_id: record.category_id,
      amount: record.amount,
      period: record.period,
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleSubmit = (values: any) => {
    const data = {
      category_id: values.category_id,
      amount: parseFloat(values.amount),
      period: values.period,
      start_date: values.start_date.toISOString(),
      end_date: values.end_date.toISOString(),
    }

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget._id, values: data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingBudget(null)
    form.resetFields()
  }

  const columns = [
    { 
      title: '分类', 
      dataIndex: 'category_ids', 
      key: 'category_ids',
      render: (vals: string[]) => {
        if (!vals || !Array.isArray(vals) || vals.length === 0) return '-';
        const val = vals[0];
        const category = EXPENSE_CATEGORIES.find(c => c.value === val)
        return category ? category.label : val
      }
    },
    { title: '预算金额', dataIndex: 'amount', key: 'amount', render: (val: number) => `¥${val?.toFixed(2) || '0.00'}` },
    { title: '已使用', dataIndex: 'spent', key: 'spent', render: (val: number) => `¥${val?.toFixed(2) || '0.00'}` },
    {
      title: '使用率',
      key: 'progress',
      render: (record: any) => {
        const amount = record.amount || 0
        const spent = record.spent || 0
        const percent = amount > 0 ? (spent / amount) * 100 : 0
        return <Progress percent={Math.round(percent)} status={percent > 80 ? 'exception' : 'normal'} />
      },
    },
    { title: '周期', dataIndex: 'period', key: 'period' },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date', render: (val: string) => dayjs(val).format('YYYY-MM-DD') },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date', render: (val: string) => dayjs(val).format('YYYY-MM-DD') },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个预算吗？"
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

  const handleSearch = (values: any) => {
    const searchFilters: any = {}
    if (values.period) searchFilters.budget_type = values.period
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
    <div className="page-container">
      <div className="page-header">
        <h1>预算管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新建预算
        </Button>
      </div>

      <Card title="搜索筛选" className="page-card">
        <Form form={searchForm} onFinish={handleSearch} layout="inline">
          <Form.Item name="period" label="预算周期">
            <Select placeholder="选择周期" style={{ width: 120 }} allowClear>
              <Select.Option value="daily">每日</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
              <Select.Option value="yearly">每年</Select.Option>
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

      <Card title="预算列表" className="page-card">
        <Table
          className="page-table"
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
      </Card>

      <Modal
        title={editingBudget ? '编辑预算' : '新建预算'}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="分类" name="category_id" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="选择分类">
              {EXPENSE_CATEGORIES.map(cat => (
                <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="预算金额" name="amount" rules={[{ required: true }]}>
            <Input type="number" prefix="¥" />
          </Form.Item>
          <Form.Item label="周期" name="period" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="daily">每日</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
              <Select.Option value="yearly">每年</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="开始日期" name="start_date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="结束日期" name="end_date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending || updateMutation.isPending}>
              {editingBudget ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Card title="预算说明" style={{ marginTop: 16 }}>
        <p><strong>什么是预算？</strong></p>
        <p>预算功能帮助您控制某个分类的支出，避免超支。</p>
        <p><strong>如何使用：</strong></p>
        <ul>
          <li>1. 点击"新建预算"按钮</li>
          <li>2. 选择要控制的分类（如"餐饮"、"购物"等）</li>
          <li>3. 设置预算金额（例如每月1000元）</li>
          <li>4. 选择预算周期（每日/每周/每月/每年）</li>
          <li>5. 设置预算的起止日期</li>
        </ul>
        <p><strong>预算监控：</strong></p>
        <ul>
          <li>系统会自动统计该分类下的支出</li>
          <li>使用率超过80%时会显示为红色警告</li>
          <li>帮助您及时发现并控制超支风险</li>
        </ul>
      </Card>
    </div>
  )
}
