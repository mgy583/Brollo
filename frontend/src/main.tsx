import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './styles/elementish.css'
// Element-like Ant tokens (always use element theme)
const ELEMENT_ANTD_THEME = {
  token: {
    colorPrimary: '#409EFF',
    borderRadius: 8,
    colorBgBase: '#f5f7fa',
    colorText: '#2c3e50',
    colorTextSecondary: 'rgba(44,62,80,0.65)',
    controlHeight: 40,
  },
}
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN} theme={ELEMENT_ANTD_THEME}>
          <App />
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
// Note: Element-like theme is applied globally above; theme switching removed per user request.
