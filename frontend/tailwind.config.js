/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        // Bảng màu Tech Edition từ Mood Board
        'bg-dark': '#070B14',      // Nền đen sâu
        'card-navy': '#0F172A',    // Xanh Navy của card
        'neon-cyan': '#00F0FF',    // Màu Cyan rực sáng (như chữ AUTHENTICATION)
        'cyber-blue': '#1E90FF',   // Xanh hiệu ứng HUD
        'energy-red': '#FF3B3B',   // Màu đỏ cảnh báo/năng lượng
        'tech-white': '#FFFFFF',   // Trắng tinh khiết
      },
      fontFamily: {
        // Font tiêu đề vuông vức, kỹ thuật số
        title: ['Orbitron', 'Anton', 'sans-serif'],
        // Font nội dung hiện đại, dễ đọc trên màn hình
        body: ['Exo 2', 'Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        // Thêm hiệu ứng hào quang Neon cho ní dễ dùng
        'neon-glow': '0 0 15px rgba(0, 240, 255, 0.4)',
        'red-glow': '0 0 15px rgba(255, 59, 59, 0.4)',
      },
      clipPath: {
        // Để làm các nút vát góc như trong ảnh
        'slant': 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)',
      }
    },
  },
  plugins: [],
}