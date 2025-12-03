import { Card, DatePicker, Space, Statistic, Table } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { Responsive, WidthProvider } from 'react-grid-layout'
import dayjs from 'dayjs'
import api from '../utils/api'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1']
const { RangePicker } = DatePicker
const ResponsiveGridLayout = WidthProvider(Responsive)

const LAYOUT_STORAGE_KEY = 'abook_reports_layout_v1'

export default function Reports() {
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf('month'), dayjs().endOf('month')])
  const defaultLayout = [
    { i: 'trend', x: 0, y: 0, w: 6, h: 8 },
    { i: 'pie', x: 6, y: 0, w: 6, h: 8 },
    { i: 'bar', x: 0, y: 8, w: 12, h: 8 },
    { i: 'table', x: 0, y: 16, w: 12, h: 8 },
    { i: 'stats', x: 0, y: 24, w: 12, h: 4 },
  ]

  const [layout, setLayout] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) {}
    return defaultLayout
  })

  const { data: monthlyData } = useQuery({
    queryKey: ['monthly-report', dateRange],
    queryFn: () => api.get('/reports/monthly', {
      params: {
        start_date: dateRange[0].toISOString(),
        end_date: dateRange[1].toISOString(),
      }
    }),
  })

  const { data: categoryData } = useQuery({
    queryKey: ['category-report', dateRange],
    queryFn: () => api.get('/reports/category', {
      params: {
        start_date: dateRange[0].toISOString(),
        end_date: dateRange[1].toISOString(),
      }
    }),
  })

  const { data: trendData } = useQuery({
    queryKey: ['trend-report', dateRange],
    queryFn: () => api.get('/reports/trend', {
      params: {
        start_date: dateRange[0].toISOString(),
        end_date: dateRange[1].toISOString(),
      }
    }),
  })

  const categoryChartData = categoryData?.data?.items?.map((item: any) => ({
    name: item.category_name || item.category_id,
    value: Math.abs(item.amount || 0),
  })) || []

  const trendChartData = trendData?.data?.items?.map((item: any) => ({
    date: dayjs(item.date).format('MM-DD'),
    income: item.income || 0,
    expense: Math.abs(item.expense || 0),
  })) || []

  const categoryTableColumns = [
    { title: '分类', dataIndex: 'category_name', key: 'category_name' },
    { title: '支出金额', dataIndex: 'amount', key: 'amount', render: (val: number) => `¥${Math.abs(val || 0).toFixed(2)}` },
    { title: '交易笔数', dataIndex: 'count', key: 'count' },
    { title: '占比', key: 'percentage', render: (record: any) => {
      const total = categoryData?.data?.items?.reduce((sum: number, item: any) => sum + Math.abs(item.amount || 0), 0) || 1
      const percent = (Math.abs(record.amount || 0) / total * 100).toFixed(1)
      return `${percent}%`
    }},
  ]

  const totalIncome = monthlyData?.data?.total_income || 0
  const totalExpense = Math.abs(monthlyData?.data?.total_expense || 0)
  const netIncome = totalIncome - totalExpense

  useEffect(() => {
    try { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout)) } catch (e) {}
  }, [layout])

  const onLayoutChange = (newLayout: any) => {
    setLayout(newLayout)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>报表分析</h1>
        <Space>
          <RangePicker 
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates)}
            format="YYYY-MM-DD"
          />
        </Space>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 2 }}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        draggableHandle=".drag-handle"
      >
        <div key="trend" data-grid={layout.find(l=>l.i==='trend') || {x:0,y:0,w:6,h:8}}>
          <Card title={<span className="drag-handle">收支趋势</span>} style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendChartData}>
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

        <div key="pie" data-grid={layout.find(l=>l.i==='pie') || {x:6,y:0,w:6,h:8}}>
          <Card title={<span className="drag-handle">分类支出占比</span>} style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.value.toFixed(0)}`}
                >
                  {categoryChartData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div key="bar" data-grid={layout.find(l=>l.i==='bar') || {x:0,y:8,w:12,h:8}}>
          <Card title={<span className="drag-handle">分类统计对比</span>} style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="支出金额">
                  {categoryChartData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div key="table" data-grid={layout.find(l=>l.i==='table') || {x:0,y:16,w:12,h:8}}>
          <Card title={<span className="drag-handle">分类详细统计</span>} style={{ height: '100%' }}>
            <Table
              columns={categoryTableColumns}
              dataSource={categoryData?.data?.items || []}
              rowKey="category_id"
              pagination={false}
            />
          </Card>
        </div>

        <div key="stats" data-grid={layout.find(l=>l.i==='stats') || {x:0,y:24,w:12,h:4}}>
          <Card title={<span className="drag-handle">关键指标</span>}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Statistic title="总收入" value={`¥${totalIncome.toFixed(2)}`} prefix={<ArrowUpOutlined />} />
              <Statistic title="总支出" value={`¥${totalExpense.toFixed(2)}`} prefix={<ArrowDownOutlined />} />
              <Statistic title="净收入" value={`¥${netIncome.toFixed(2)}`} />
            </Space>
          </Card>
        </div>
      </ResponsiveGridLayout>
    </div>
  )
}
