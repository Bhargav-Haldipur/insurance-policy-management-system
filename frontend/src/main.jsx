import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import './index.css'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: '#111111', secondary: '#555555' },
  },
  shadows: Array(25).fill('none'),
  components: {
    MuiPaper: { defaultProps: { elevation: 0, variant: 'outlined' } },
    MuiCard: { defaultProps: { elevation: 0, variant: 'outlined' } },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
