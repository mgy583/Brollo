import { DatePicker, Space, Statistic, Table, Button, Switch, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, DragOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import dayjs from 'dayjs'
import api from '../utils/api'
import { EXPENSE_CATEGORIES } from '../utils/constants'

const { RangePicker } = DatePicker
const { Text } = Typography
const ResponsiveGridLayout = WidthProvider(Responsive)

const LAYOUT_STORAGE_KEY = 'brollo_reports_layout_v2'

export default function Reports() {
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf('month'), dayjs().endOf('month')])
  const [isEditing, setIsEditing] = useState(false)
  
  const defaultLayout = [
    { i: 'trend', x: 0, y: 0, w: 8, h: 10 },
    { i: 'pie', x: 8, y: 0, w: 4, h: 10 },
    { i: 'bar', x: 0, y: 10, w: 12, h: 8 },
    { i: 'table', x: 0, y: 18, w: 12, h: 8 },
    { i: 'stats', x: 0, y: 26, w: 12, h: 4 },
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

  const categoryChartData = (Array.isArray(categoryData?.data) ? categoryData.data : []).map((item: any) => {
    const category = EXPENSE_CATEGORIES.find(c => c.value === item.category_id)
    return {
      name: category ? category.label : (item.category_name || item.category_id),
      value: Math.abs(item.amount || 0),
    }
  })

  const trendChartData = (trendData?.data?.daily_data || []).map((item: any) => ({
    date: dayjs(item.date).format('MM-DD'),
    income: item.income || 0,
    expense: Math.abs(item.expense || 0),
  }))

  const categoryTableColumns = [
    { 
      title: '分类', 
      dataIndex: 'category_id', 
      key: 'category_id',
      render: (val: string) => {
        const category = EXPENSE_CATEGORIES.find(c => c.value === val)
        return category ? category.label : val
      }
    },
    { title: '支出金额', dataIndex: 'amount', key: 'amount', render: (val: number) => `¥${Math.abs(val || 0).toFixed(2)}` },
    { title: '交易笔数', dataIndex: 'count', key: 'count' },
    { title: '占比', key: 'percentage', render: (record: any) => {
      const list = Array.isArray(categoryData?.data) ? categoryData.data : []
      const total = list.reduce((sum: number, item: any) => sum + Math.abs(item.amount || 0), 0) || 1
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

  const resetLayout = () => {
    setLayout(defaultLayout)
  }

  // ECharts Options
  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: trendChartData.map((d: any) => d.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '收入',
        type: 'line',
        smooth: true,
        data: trendChartData.map((d: any) => d.income),
        itemStyle: { color: '#52c41a' },
        areaStyle: { opacity: 0.1, color: '#52c41a' }
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        data: trendChartData.map((d: any) => d.expense),
        itemStyle: { color: '#f5222d' },
        areaStyle: { opacity: 0.1, color: '#f5222d' }
      }
    ]
  }

  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, left: 'center' },
    series: [
      {
        name: '支出分类',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: categoryChartData
      }
    ]
  }

  const barOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: categoryChartData.map((d: any) => d.name), axisLabel: { interval: 0, rotate: 30 } },
    yAxis: { type: 'value' },
    series: [
      {
        name: '支出金额',
        type: 'bar',
        data: categoryChartData.map((d: any) => d.value),
        itemStyle: { color: '#1890ff', borderRadius: [5, 5, 0, 0] },
        showBackground: true,
        backgroundStyle: { color: 'rgba(180, 180, 180, 0.2)' }
      }
    ]
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>报表分析</h1>
        <Space>
          <Space>
            <Text>自定义布局</Text>
            <Switch checked={isEditing} onChange={setIsEditing} checkedChildren="开启" unCheckedChildren="关闭" />
          </Space>
          {isEditing && (
            <Button icon={<ReloadOutlined />} onClick={resetLayout}>重置布局</Button>
          )}
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
        isDraggable={isEditing}
        isResizable={isEditing}
        margin={[16, 16]}
      >
        <div key="trend" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div className="drag-handle" style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: isEditing ? 'move' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>收支趋势</span>
            {isEditing && <DragOutlined style={{ color: '#999' }} />}
          </div>
          <div style={{ padding: 16, height: 'calc(100% - 47px)' }}>
            <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div key="pie" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div className="drag-handle" style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: isEditing ? 'move' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>分类支出占比</span>
            {isEditing && <DragOutlined style={{ color: '#999' }} />}
          </div>
          <div style={{ padding: 16, height: 'calc(100% - 47px)' }}>
            <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div key="bar" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div className="drag-handle" style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: isEditing ? 'move' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>分类统计对比</span>
            {isEditing && <DragOutlined style={{ color: '#999' }} />}
          </div>
          <div style={{ padding: 16, height: 'calc(100% - 47px)' }}>
            <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div key="table" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="drag-handle" style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: isEditing ? 'move' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>分类详细统计</span>
            {isEditing && <DragOutlined style={{ color: '#999' }} />}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Table
              columns={categoryTableColumns}
              dataSource={Array.isArray(categoryData?.data) ? categoryData.data : []}
              rowKey="category_id"
              pagination={false}
              size="small"
            />
          </div>
        </div>

        <div key="stats" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div className="drag-handle" style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: isEditing ? 'move' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>关键指标</span>
            {isEditing && <DragOutlined style={{ color: '#999' }} />}
          </div>
          <div style={{ padding: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'space-around' }}>
              <Statistic title="总收入" value={`¥${totalIncome.toFixed(2)}`} prefix={<ArrowUpOutlined />} valueStyle={{ color: '#3f8600' }} />
              <Statistic title="总支出" value={`¥${totalExpense.toFixed(2)}`} prefix={<ArrowDownOutlined />} valueStyle={{ color: '#cf1322' }} />
              <Statistic title="净收入" value={`¥${netIncome.toFixed(2)}`} valueStyle={{ color: netIncome >= 0 ? '#3f8600' : '#cf1322' }} />
            </Space>
          </div>
        </div>
      </ResponsiveGridLayout>
    </div>
  )
}
