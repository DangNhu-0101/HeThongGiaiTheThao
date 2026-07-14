import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // 1. Khởi tạo thẳng giá trị dựa trên kích thước màn hình ngay lúc component render
  // (Kiểm tra typeof window để phòng hờ nếu chạy trong môi trường SSR/Next.js)
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", onChange)
    
    // 2. Đã xóa dòng gọi setIsMobile đồng bộ ở đây -> ESLint sẽ hết báo lỗi đỏ
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // 3. Trả thẳng về isMobile vì bây giờ nó chắc chắn là boolean (không còn undefined nữa)
  return isMobile
}