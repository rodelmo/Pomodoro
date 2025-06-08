import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer, Settings, X } from 'lucide-react'

type TimerMode = 'work' | 'break'

interface SettingsModalProps {
  workDuration: number
  breakDuration: number
  onSave: (workDuration: number, breakDuration: number) => void
  onClose: () => void
}

function SettingsModal({ workDuration, breakDuration, onSave, onClose }: SettingsModalProps) {
  const [tempWorkDuration, setTempWorkDuration] = useState(workDuration)
  const [tempBreakDuration, setTempBreakDuration] = useState(breakDuration)

  const handleSave = () => {
    // Validate inputs (minimum 1 minute, maximum 120 minutes)
    const validWorkDuration = Math.max(1, Math.min(120, tempWorkDuration))
    const validBreakDuration = Math.max(1, Math.min(60, tempBreakDuration))
    
    onSave(validWorkDuration, validBreakDuration)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light">Settings</h2>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 transition-all duration-200 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">
              Focus Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={tempWorkDuration}
              onChange={(e) => setTempWorkDuration(parseInt(e.target.value) || 1)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
            />
            <p className="text-xs opacity-60 mt-1">Recommended: 25 minutes</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              Break Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={tempBreakDuration}
              onChange={(e) => setTempBreakDuration(parseInt(e.target.value) || 1)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
            />
            <p className="text-xs opacity-60 mt-1">Recommended: 5 minutes</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 transition-all duration-200 px-6 py-3 rounded-full text-white font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-white/20 hover:bg-white/30 transition-all duration-200 px-6 py-3 rounded-full text-white font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<TimerMode>('work')
  const [sessions, setSessions] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Customizable durations (in minutes)
  const [workDuration, setWorkDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  
  const workTime = workDuration * 60 // Convert to seconds
  const breakTime = breakDuration * 60 // Convert to seconds

  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const createBeepSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }

    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      createBeepSound()
      setIsActive(false)
      
      if (mode === 'work') {
        setSessions(s => s + 1)
        setMode('break')
        setTimeLeft(breakTime)
      } else {
        setMode('work')
        setTimeLeft(workTime)
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, timeLeft, mode, workTime, breakTime])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setMode('work')
    setTimeLeft(workTime)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const openSettings = () => {
    setShowSettings(true)
  }

  const closeSettings = () => {
    setShowSettings(false)
  }

  const saveSettings = (newWorkDuration: number, newBreakDuration: number) => {
    setWorkDuration(newWorkDuration)
    setBreakDuration(newBreakDuration)
    
    // Reset timer if it's not running and adjust current time
    if (!isActive) {
      if (mode === 'work') {
        setTimeLeft(newWorkDuration * 60)
      } else {
        setTimeLeft(newBreakDuration * 60)
      }
    }
    
    setShowSettings(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = mode === 'work' 
    ? ((workTime - timeLeft) / workTime) * 100 
    : ((breakTime - timeLeft) / breakTime) * 100

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8 relative">
          <h1 className="text-4xl font-light mb-2 flex items-center justify-center gap-3">
            <Timer className="w-8 h-8" />
            Pomodoro Timer
          </h1>
          <button
            onClick={openSettings}
            className="absolute top-[3px] right-[-1px] bg-white/10 hover:bg-white/20 transition-all duration-200 p-2 rounded-full backdrop-blur-sm border border-white/20"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <p className="text-lg opacity-80">
            {mode === 'work' ? 'Focus Time' : 'Break Time'}
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-3xl p-12 mb-8 shadow-2xl border border-white/30">
          <div className="relative mb-8">
            <div className="w-64 h-64 mx-auto relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-mono font-light mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm opacity-60">
                    {mode === 'work' ? 'minutes of focus' : 'minutes of rest'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={toggleTimer}
              className="bg-white/20 hover:bg-white/30 transition-all duration-200 px-8 py-4 rounded-full flex items-center gap-3 text-lg font-medium backdrop-blur-sm border border-white/20"
            >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            
            <button
              onClick={resetTimer}
              className="bg-white/10 hover:bg-white/20 transition-all duration-200 px-8 py-4 rounded-full flex items-center gap-3 text-lg font-medium backdrop-blur-sm border border-white/20"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm opacity-60 mb-2">Sessions completed</p>
            <p className="text-3xl font-light">{sessions}</p>
          </div>
        </div>

        <div className="text-center opacity-60">
          <p className="text-sm">
            {mode === 'work' ? `Work for ${workDuration} minutes, then take a ${breakDuration}-minute break` : `Take a ${breakDuration}-minute break, then back to work`}
          </p>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            workDuration={workDuration}
            breakDuration={breakDuration}
            onSave={saveSettings}
            onClose={closeSettings}
          />
        )}
      </div>
    </div>
  )
}

export default App 