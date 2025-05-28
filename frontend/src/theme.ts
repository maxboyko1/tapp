import { ThemeOptions } from '@mui/material/styles';

export const themeOptions: ThemeOptions = {
    palette: {
        primary: {
            main: '#1e3765',
        },
        secondary: {
            main: '#ab1368',
        },
        error: {
            main: '#dc4633',
        },
        warning: {
            main: '#f1c500',
        },
        info: {
            main: '#6fc7ea',
        },
        success: {
            main: '#00a189',
        },
        background: {
            default: '#f3f3f3',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: 'Helvetica Neue, sans-serif',
        fontSize: 14,
        h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 500,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
        },
    },
};