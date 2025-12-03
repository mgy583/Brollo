import { Row, Col, Card, Statistic, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import api from '../utils/api'

const { Title } = Typography

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
      <Title level={2} style={{ marginBottom: 24, fontWeight: 300 }}>
        欢迎回来，<span style={{ fontWeight: 600 }}>Brollo</span>
      </Title>
      
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="总收入"
              value={stats?.data?.total_income || 0}
              precision={2}
              valueStyle={{ color: '#3f8600', fontSize: 24, fontWeight: 600 }}
              prefix={<ArrowUpOutlined />}
              suffix="¥"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="总支出"
              value={stats?.data?.total_expense || 0}
              precision={2}
              valueStyle={{ color: '#cf1322', fontSize: 24, fontWeight: 600 }}
              prefix={<ArrowDownOutlined />}
              suffix="¥"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="净收入"
              value={(stats?.data?.total_income || 0) - (stats?.data?.total_expense || 0)}
              precision={2}
              valueStyle={{ color: (stats?.data?.total_income || 0) - (stats?.data?.total_expense || 0) >= 0 ? '#3f8600' : '#cf1322', fontSize: 24, fontWeight: 600 }}
              suffix="¥"
            />
          </Card>
        </Col>
      </Row>

      <Card title="收支趋势" bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={trendData?.data?.daily_data || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3f8600" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3f8600" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#cf1322" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#cf1322" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <Tooltip 
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Area type="monotone" dataKey="income" stroke="#3f8600" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name="收入" />
            <Area type="monotone" dataKey="expense" stroke="#cf1322" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name="支出" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
