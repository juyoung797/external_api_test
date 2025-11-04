import { Map, MapMarker, CustomOverlayMap, Polyline, useKakaoLoader } from "react-kakao-maps-sdk"
import { useEffect, useRef, useState } from "react"

export default function App() {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
    libraries: ["clusterer", "drawing", "services"],
  })

  const [isWalking, setIsWalking] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [path, setPath] = useState([])
  const [distance, setDistance] = useState(0)
  const [position, setPosition] = useState(null)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false) // ✅ 오버레이 토글
  const overlayPos = useRef(null)
  const watchId = useRef(null)

  // Haversine
  const d = (a,b,c,d)=>{const R=6371e3,rad=x=>x*Math.PI/180,φ1=rad(a),φ2=rad(c),Δφ=rad(c-a),Δλ=rad(d-b)
    const A=Math.sin(Δφ/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
    return R*2*Math.atan2(Math.sqrt(A),Math.sqrt(1-A))}

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({coords}) => setPosition({lat: coords.latitude, lng: coords.longitude}),
      console.error,
      { enableHighAccuracy: true }
    )
  }, [])

  const startWalk = () => {
    if (!navigator.geolocation) return
    setIsWalking(true); setPath([]); setDistance(0)
    setStartTime(new Date()); setEndTime(null)
    setIsOverlayOpen(false); overlayPos.current = null

    watchId.current = navigator.geolocation.watchPosition(
      ({coords}) => {
        const np = { lat: coords.latitude, lng: coords.longitude }
        setPosition(np)
        setPath(prev => {
          if (prev.length) setDistance(m => m + d(prev.at(-1).lat, prev.at(-1).lng, np.lat, np.lng))
          return [...prev, np]
        })
      },
      console.error,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }

  const endWalk = () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
    setIsWalking(false); setEndTime(new Date())
    if (path.length) { overlayPos.current = path.at(-1); setIsOverlayOpen(true) }
  }

  const secs = () => (startTime && endTime) ? Math.round((endTime - startTime)/1000) : 0

  if (error) return <div>❌ Kakao SDK 로드 오류</div>
  if (loading) return <div className="h-screen flex items-center justify-center">🌀 로딩...</div>

  const markerPosition = position || { lat: 37.5665, lng: 126.978 }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-200 p-6">
      <div className="w-full max-w-3xl rounded-2xl shadow-lg bg-white p-4">
        <h1 className="text-2xl font-bold text-orange-600 mb-4">🐾 실시간 산책 추적</h1>

        <Map
          center={markerPosition}
          level={4}
          style={{ width: "100%", height: "450px", borderRadius: 12 }}
        >
          <MapMarker position={markerPosition} onClick={() => setIsOverlayOpen(o=>!o)} />

          {path.length > 1 && (
            <Polyline
              path={path}
              strokeWeight={6}
              strokeColor={isWalking ? "#FFA500" : "#666"}
              strokeOpacity={0.6}        // ✅ 투명도 60%
              strokeStyle="solid"
            />
          )}

          {/* ✅ 커스텀 오버레이: 배경/그림자 강제 + 높은 z-index */}
          {!isWalking && endTime && overlayPos.current && isOverlayOpen && (
            <CustomOverlayMap position={overlayPos.current} xAnchor={0.5} yAnchor={1.2}>
              <div
                className="rounded-2xl shadow-2xl border border-orange-200"
                style={{
                  backgroundColor: "rgba(255,255,255,0.98)",  // ✅ 배경 강제
                  zIndex: 9999,                                 // ✅ 맨 위
                  padding: 16,
                  width: 288,
                  position: "relative",
                  pointerEvents: "auto"                         // 클릭 가능
                }}
              >
                <button
                  onClick={() => setIsOverlayOpen(false)}
                  className="absolute top-2 right-3 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>

                <div className="text-sm font-semibold text-orange-600 mb-1">🏁 산책 종료</div>
                <div className="text-gray-800 text-sm space-y-1">
                  <p>⏱️ 시간: {secs()}초</p>
                  <p>📏 거리: {(distance/1000).toFixed(2)} km</p>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setIsOverlayOpen(false)}
                    className="flex-1 py-2 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-100 transition"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </CustomOverlayMap>
          )}
        </Map>

        <div className="flex justify-center gap-4 mt-6">
          {!isWalking ? (
            <button onClick={startWalk} className="px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">
              🚶 산책 시작
            </button>
          ) : (
            <button onClick={endWalk} className="px-6 py-2 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition">
              🛑 산책 종료
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
