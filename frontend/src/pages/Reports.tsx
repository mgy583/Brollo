import { Card, Row, Col } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import api from '../utils/api'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Reports() {
  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-report'],
    queryFn: () => api.get('/reports/monthly'),
  })

  const { data: categoryData } = useQuery({
    queryKey: ['category-report'],
    queryFn: () => api.get('/reports/category'),
  })

  const chartData = categoryData?.data?.map((item: any) => ({
    name: item.category_name,
    value: item.amount,
  })) || []

  return (
    <div>
      <h1>报表分析</h1>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="月度统计">
            <p>总收入: ¥{monthlyData?.data?.total_income?.toFixed(2) || 0}</p>
            <p>总支出: ¥{monthlyData?.data?.total_expense?.toFixed(2) || 0}</p>
            <p>净收入: ¥{monthlyData?.data?.net_income?.toFixed(2) || 0}</p>
            <p>交易笔数: {monthlyData?.data?.transaction_count || 0}</p>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="分类支出占比">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {chartData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
