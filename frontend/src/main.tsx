import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './styles/elementish.css'
import { useThemeStore } from './stores/themeStore'

// Clear light/dark tokens for stronger contrast
const LIGHT_ANTD_THEME = {
  token: {
    colorPrimary: '#409EFF',
    borderRadius: 8,
    colorBgBase: '#f5f7fa',
    colorText: '#2c3e50',
    colorTextSecondary: 'rgba(44,62,80,0.65)',
    controlHeight: 40,
  },
}

const DARK_ANTD_THEME = {
  token: {
    colorPrimary: '#40a9ff',
    borderRadius: 8,
    colorBgBase: '#0f1724',
    colorText: '#e6eef8',
    colorTextSecondary: 'rgba(230,238,248,0.7)',
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
        {/* Read user's theme preference from zustand and apply tokens accordingly */}
        <ThemeProviderWrapper>
          <App />
        </ThemeProviderWrapper>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  React.useEffect(() => {
    try {
      // set data attribute so CSS can toggle variables
      document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
    } catch (e) {}
  }, [theme])

  const themeTokens = theme === 'dark' ? DARK_ANTD_THEME : LIGHT_ANTD_THEME
  return (
    <ConfigProvider locale={zhCN} theme={themeTokens}>
      {children}
    </ConfigProvider>
  )
}
