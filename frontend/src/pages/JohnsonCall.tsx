import { useState } from 'react'
import { ArrowLeft, Camera, CameraOff, MessageCircle, Mic, MicOff, PhoneOff, Sparkles, Volume2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function JohnsonCall() {
  const navigate = useNavigate()
  const [muted, setMuted] = useState(false)
  const [camera, setCamera] = useState(true)

  return <div className="relative h-[100dvh] overflow-hidden bg-[#07101d] text-white">
    <img src="/demo/johnson-avatar.png" alt="Johnson, a fictional AI digital person" className="absolute inset-0 h-full w-full object-cover object-center" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-[#05070d]/95" />
    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)' }}>
      <button onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-xl"><ArrowLeft className="h-5 w-5" /></button>
      <div className="rounded-full bg-black/35 px-4 py-2 text-center backdrop-blur-xl"><div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Johnson</div><p className="text-[10px] uppercase tracking-[.2em] text-white/55">AI digital person · Demo</p></div>
      <button className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-xl"><MessageCircle className="h-5 w-5" /></button>
    </div>

    {camera && <div className="absolute right-4 top-28 h-40 w-28 overflow-hidden rounded-3xl border border-white/25 bg-[#171922] shadow-2xl">
      <img src="/demo/memories/spring-picnic.png" alt="Simulated local camera preview" className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 px-3 py-2 text-[10px] font-semibold">You · Camera preview</div>
    </div>}

    <div className="absolute inset-x-0 bottom-0 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
      <div className="mx-auto mb-5 max-w-sm rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-2xl">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-300"><Sparkles className="h-4 w-4" />Johnson is speaking</div>
        <p className="text-sm leading-6 text-white/85">“Your travel map has four new places. Want to revisit the Tokyo night market memory together?”</p>
        <p className="mt-2 text-[10px] text-white/40">Simulated conversation · Backend connection is currently disabled</p>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setMuted(!muted)} className={`flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-xl ${muted ? 'bg-white text-black' : 'bg-white/15'}`}>{muted ? <MicOff /> : <Mic />}</button>
        <button onClick={() => setCamera(!camera)} className={`flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-xl ${!camera ? 'bg-white text-black' : 'bg-white/15'}`}>{camera ? <Camera /> : <CameraOff />}</button>
        <button className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-xl shadow-red-500/30"><PhoneOff /></button>
        <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-xl"><Volume2 /></button>
      </div>
    </div>
  </div>
}
