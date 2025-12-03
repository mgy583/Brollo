import { Row, Col, Card, Statistic } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../utils/api'

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.get('/transactions/statistics'),
  })

  const { data: trendData } = useQuery({
    queryKey: ['trend'],
    queryFn: () => api.get('/reports/trend'),
  })

  return (
    <div>
      <h1>仪表盘</h1>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总收入"
              value={stats?.data?.total_income || 0}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总支出"
              value={stats?.data?.total_expense || 0}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="净收入"
              value={(stats?.data?.total_income || 0) - (stats?.data?.total_expense || 0)}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Card title="收支趋势">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData?.data?.daily_data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#3f8600" name="收入" />
            <Line type="monotone" dataKey="expense" stroke="#cf1322" name="支出" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
