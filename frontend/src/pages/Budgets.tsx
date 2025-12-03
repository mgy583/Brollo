import { Table, Card, Progress } from 'antd'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'

export default function Budgets() {
  const { data, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get('/budgets'),
  })

  const columns = [
    { title: '分类', dataIndex: 'category_id', key: 'category_id' },
    { title: '预算金额', dataIndex: 'amount', key: 'amount', render: (val: number) => `¥${val.toFixed(2)}` },
    { title: '已使用', dataIndex: 'spent', key: 'spent', render: (val: number) => `¥${val.toFixed(2)}` },
    {
      title: '使用率',
      key: 'progress',
      render: (record: any) => {
        const percent = (record.spent / record.amount) * 100
        return <Progress percent={Math.round(percent)} status={percent > 80 ? 'exception' : 'normal'} />
      },
    },
    { title: '周期', dataIndex: 'period', key: 'period' },
  ]

  return (
    <div>
      <h1>预算管理</h1>

      <Card title="预算列表" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={data?.data?.data || []}
          loading={isLoading}
          rowKey="_id"
        />
      </Card>
    </div>
  )
}
