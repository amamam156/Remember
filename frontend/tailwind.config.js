/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#08080A',
          800: '#1A1B22',
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        wechat: {
          green: '#07c160',
          blue: '#10aeff',
          orange: '#ff9500',
          red: '#fa5151',
          yellow: '#ffc300',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
      },
      boxShadow: {
        'wechat': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'wechat-lg': '0 4px 20px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'wechat': '16px',
        'wechat-lg': '24px',
      }
    },
  },
  plugins: [],
}
