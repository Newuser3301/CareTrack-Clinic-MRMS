export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e9f6ff',
          100: '#d2ecff',
          500: '#1d8de2',
          600: '#0d72c4',
          700: '#075795'
        }
      },
      boxShadow: {
        soft: '0 30px 80px rgba(12, 78, 135, 0.25)',
        panel: '0 16px 34px rgba(13, 86, 151, 0.11)',
        insetBlue: 'inset 0 1px 0 rgba(255,255,255,0.7)'
      }
    }
  },
  plugins: []
};
