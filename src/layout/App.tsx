import { createTheme, ThemeProvider } from '@mui/material';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Notification from '../common/Notification';
import { Main } from './Main';
import { TopNav } from './TopNav';

export function App() {
  const theme = createTheme({
    palette: {
      mode: 'dark',
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <TopNav />
        <main className="mdc-top-app-bar--fixed-adjust">
          <div className="App">
            <div className="container">
              <Routes>
                <Route path="/" element={<Main />} />
              </Routes>
            </div>
          </div>
        </main>
        <Notification />
      </Router>
    </ThemeProvider>
  );
}
