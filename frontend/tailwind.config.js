export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8fbff',
          100: '#d4f5fb',
          500: '#0ea5c6',
          600: '#0f7490',
          700: '#073b4a'
        }
      },
      boxShadow: {
        soft: '0 24px 60px rgba(3, 42, 54, 0.14)',
        panel: '0 18px 45px rgba(15, 23, 42, 0.10)'
      }
    }
  },
  plugins: []
};
