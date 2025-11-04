// 📄 TestMap.jsx
import { useEffect, useRef } from "react"

export default function TestMap() {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!window.kakao?.maps) return

    const container = mapRef.current
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.978), // 서울
      level: 3,
    }

    new window.kakao.maps.Map(container, options)
  }, [])

  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-xl overflow-hidden"
    />
  )
}
