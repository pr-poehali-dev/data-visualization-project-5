import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Icon from "@/components/ui/icon"
import { api } from "@/lib/api"

const SUBJECTS = ["Математика", "Русский язык", "Физика", "История", "Биология", "Химия", "Литература"]
const CLASSES = ["7А", "7Б", "8А", "8Б", "9А", "9Б", "10А", "11А"]
const LESSONS = Array.from({ length: 10 }, (_, i) => i)
const CORRECTION_REASONS = [
  "Ошибка при выставлении оценки",
  "Пересдача / повторная работа",
  "Апелляция ученика / родителей",
]
const GRADE_COLORS: Record<number, string> = {
  5: "text-emerald-400",
  4: "text-blue-400",
  3: "text-yellow-400",
  2: "text-red-400",
  1: "text-red-500",
}

interface Teacher { id: number; name: string; email: string }
interface Student { id: number; name: string; class: string }
interface GradeData { student_id: number; lesson_index: number; grade: number | null; grade_id: number }
interface AttendanceData { student_id: number; lesson_index: number; present: boolean }
interface HomeworkItem { id: number; class: string; subject: string; description: string; due_date: string | null; created_at: string }
interface Correction { id: number; student_name: string; subject: string; lesson_index: number; old_grade: number; new_grade: number; reason: string; corrected_at: string }

const glass = "bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl"

// ──────────────────────────────────────────────
// AUTH SCREEN
// ──────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (teacher: Teacher, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError("")
    setLoading(true)
    try {
      const res = mode === "login"
        ? await api.auth.login(email, password)
        : await api.auth.register(email, name, password)
      if (res.error) { setError(res.error); return }
      localStorage.setItem("auth_token", res.token)
      onAuth(res.teacher, res.token)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <AnimatedBg />
      <div className={`${glass} w-full max-w-sm mx-4 p-8 relative z-10`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <Icon name="BookOpen" size={20} className="text-indigo-300" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Классный журнал</h1>
            <p className="text-white/40 text-xs mt-0.5">Для учителей</p>
          </div>
        </div>

        <div className="flex mb-6 bg-white/5 rounded-xl p-1">
          {(["login", "register"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? "bg-indigo-500/40 text-indigo-200" : "text-white/40 hover:text-white/60"}`}>
              {m === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {mode === "register" && (
            <div>
              <Label className="text-white/60 text-xs mb-1.5 block">Ваше имя</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Иванова Мария Петровна"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
            </div>
          )}
          <div>
            <Label className="text-white/60 text-xs mb-1.5 block">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@school.ru" type="email"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
          </div>
          <div>
            <Label className="text-white/60 text-xs mb-1.5 block">Пароль</Label>
            <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" type="password"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button onClick={submit} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full mt-2">
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// ANIMATED BG
// ──────────────────────────────────────────────
function AnimatedBg() {
  return (
    <div className="absolute inset-0 bg-black">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="np1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="30%" stopColor="rgba(99,102,241,1)" />
            <stop offset="100%" stopColor="rgba(79,70,229,0)" />
          </radialGradient>
          <radialGradient id="np2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="25%" stopColor="rgba(139,92,246,0.9)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0)" />
          </radialGradient>
          <linearGradient id="tf1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,1)" />
            <stop offset="15%" stopColor="rgba(99,102,241,0.8)" />
            <stop offset="85%" stopColor="rgba(99,102,241,0.8)" />
            <stop offset="100%" stopColor="rgba(0,0,0,1)" />
          </linearGradient>
          <linearGradient id="tf2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,1)" />
            <stop offset="12%" stopColor="rgba(139,92,246,0.7)" />
            <stop offset="88%" stopColor="rgba(139,92,246,0.7)" />
            <stop offset="100%" stopColor="rgba(0,0,0,1)" />
          </linearGradient>
          <linearGradient id="tf3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,1)" />
            <stop offset="18%" stopColor="rgba(167,139,250,0.8)" />
            <stop offset="82%" stopColor="rgba(167,139,250,0.8)" />
            <stop offset="100%" stopColor="rgba(0,0,0,1)" />
          </linearGradient>
          <filter id="ng"><feGaussianBlur stdDeviation="2" result="cb" /><feMerge><feMergeNode in="cb" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path id="t1" d="M50 720 Q200 590 350 540 Q500 490 650 520 Q800 550 950 460 Q1100 370 1200 340" stroke="url(#tf1)" strokeWidth="0.8" fill="none" opacity="0.8" />
        <circle r="2" fill="url(#np1)" filter="url(#ng)"><animateMotion dur="4s" repeatCount="indefinite"><mpath href="#t1" /></animateMotion></circle>
        <path id="t2" d="M80 730 Q250 620 400 570 Q550 520 700 550 Q850 580 1000 490 Q1150 400 1300 370" stroke="url(#tf2)" strokeWidth="1.5" fill="none" opacity="0.7" />
        <circle r="3" fill="url(#np2)" filter="url(#ng)"><animateMotion dur="5s" repeatCount="indefinite"><mpath href="#t2" /></animateMotion></circle>
        <path id="t3" d="M20 700 Q180 560 320 510 Q460 460 600 500 Q740 540 900 430 Q1050 320 1180 310" stroke="url(#tf3)" strokeWidth="1.2" fill="none" opacity="0.6" />
        <circle r="2.5" fill="url(#np1)" filter="url(#ng)"><animateMotion dur="6s" repeatCount="indefinite"><mpath href="#t3" /></animateMotion></circle>
        <path id="t4" d="M100 760 Q280 640 430 590 Q580 540 720 560 Q860 580 1010 500 Q1160 420 1250 390" stroke="url(#tf2)" strokeWidth="2" fill="none" opacity="0.4" />
        <circle r="4" fill="url(#np2)" filter="url(#ng)"><animateMotion dur="3.5s" repeatCount="indefinite"><mpath href="#t4" /></animateMotion></circle>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-violet-950/30" />
    </div>
  )
}

// ──────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────
export default function Index() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [selectedClass, setSelectedClass] = useState(CLASSES[4])
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0])
  const [activeTab, setActiveTab] = useState("grades")

  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<GradeData[]>([])
  const [attendance, setAttendance] = useState<AttendanceData[]>([])
  const [homework, setHomework] = useState<HomeworkItem[]>([])
  const [corrections, setCorrections] = useState<Correction[]>([])

  const [loadingData, setLoadingData] = useState(false)
  const [editingCell, setEditingCell] = useState<{ studentId: number; lessonIndex: number } | null>(null)
  const [correctionModal, setCorrectionModal] = useState<{ studentId: number; lessonIndex: number; oldGrade: number } | null>(null)
  const [correctionReason, setCorrectionReason] = useState("")
  const [correctionNewGrade, setCorrectionNewGrade] = useState("")

  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [newStudentName, setNewStudentName] = useState("")

  const [hwDescription, setHwDescription] = useState("")
  const [hwDueDate, setHwDueDate] = useState("")

  // Check session
  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) { setAuthChecked(true); return }
    api.auth.me(token).then(res => {
      if (res.teacher) setTeacher(res.teacher)
      setAuthChecked(true)
    }).catch(() => setAuthChecked(true))
  }, [])

  const loadData = useCallback(async () => {
    if (!teacher) return
    setLoadingData(true)
    try {
      const [studRes, gradeRes, attRes, hwRes, corrRes] = await Promise.all([
        api.students.list(selectedClass),
        api.grades.list(selectedClass, selectedSubject),
        api.attendance.list(selectedClass, selectedSubject),
        api.homework.list(selectedClass, selectedSubject),
        api.grades.corrections(selectedClass, selectedSubject),
      ])
      setStudents(studRes.students || [])
      setGrades(gradeRes.grades || [])
      setAttendance(attRes.attendance || [])
      setHomework(hwRes.homework || [])
      setCorrections(corrRes.corrections || [])
    } finally {
      setLoadingData(false)
    }
  }, [teacher, selectedClass, selectedSubject])

  useEffect(() => { loadData() }, [loadData])

  const getGrade = (studentId: number, lessonIndex: number) =>
    grades.find(g => g.student_id === studentId && g.lesson_index === lessonIndex)?.grade ?? null

  const getPresent = (studentId: number, lessonIndex: number) =>
    attendance.find(a => a.student_id === studentId && a.lesson_index === lessonIndex)?.present ?? true

  const getAverage = (studentId: number) => {
    const gs = grades.filter(g => g.student_id === studentId && g.grade !== null).map(g => g.grade as number)
    if (!gs.length) return "—"
    return (gs.reduce((a, b) => a + b, 0) / gs.length).toFixed(1)
  }

  const handleGradeClick = (studentId: number, lessonIndex: number) => {
    const existing = getGrade(studentId, lessonIndex)
    if (existing !== null) {
      setCorrectionModal({ studentId, lessonIndex, oldGrade: existing })
      setCorrectionReason("")
      setCorrectionNewGrade(String(existing))
    } else {
      setEditingCell({ studentId, lessonIndex })
    }
  }

  const saveGrade = async (studentId: number, lessonIndex: number, value: string, reason?: string) => {
    const grade = value === "" ? null : parseInt(value)
    if (grade !== null && (grade < 1 || grade > 5)) return
    await api.grades.set(studentId, selectedSubject, lessonIndex, grade, reason)
    await loadData()
  }

  const handleCorrectionSave = async () => {
    if (!correctionModal || !correctionReason) return
    await saveGrade(correctionModal.studentId, correctionModal.lessonIndex, correctionNewGrade, correctionReason)
    setCorrectionModal(null)
  }

  const toggleAttendance = async (studentId: number, lessonIndex: number) => {
    const current = getPresent(studentId, lessonIndex)
    await api.attendance.set(studentId, selectedSubject, lessonIndex, !current)
    setAttendance(prev => {
      const exists = prev.find(a => a.student_id === studentId && a.lesson_index === lessonIndex)
      if (exists) return prev.map(a => a.student_id === studentId && a.lesson_index === lessonIndex ? { ...a, present: !current } : a)
      return [...prev, { student_id: studentId, lesson_index: lessonIndex, present: !current }]
    })
  }

  const addStudent = async () => {
    if (!newStudentName.trim()) return
    await api.students.add(newStudentName.trim(), selectedClass)
    setNewStudentName("")
    setAddStudentOpen(false)
    loadData()
  }

  const removeStudent = async (id: number) => {
    await api.students.remove(id)
    setStudents(prev => prev.filter(s => s.id !== id))
  }

  const addHomework = async () => {
    if (!hwDescription.trim()) return
    await api.homework.add(selectedClass, selectedSubject, hwDescription, hwDueDate || undefined)
    setHwDescription("")
    setHwDueDate("")
    loadData()
  }

  const deleteHomework = async (id: number) => {
    await api.homework.delete(id)
    setHomework(prev => prev.filter(h => h.id !== id))
  }

  const logout = () => {
    const token = localStorage.getItem("auth_token")
    if (token) api.auth.logout(token)
    localStorage.removeItem("auth_token")
    setTeacher(null)
  }

  const classStats = () => {
    const avgs = students.map(s => {
      const gs = grades.filter(g => g.student_id === s.id && g.grade !== null).map(g => g.grade as number)
      return gs.length ? gs.reduce((a, b) => a + b, 0) / gs.length : null
    }).filter(a => a !== null) as number[]
    if (!avgs.length) return { avg: "—", excellent: 0, poor: 0 }
    return {
      avg: (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1),
      excellent: avgs.filter(a => a >= 4.5).length,
      poor: avgs.filter(a => a < 3).length,
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!teacher) {
    return <AuthScreen onAuth={(t) => setTeacher(t)} />
  }

  const stats = classStats()

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBg />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`mx-4 mt-4 px-5 py-3.5 ${glass} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Icon name="BookOpen" size={18} className="text-indigo-300" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">Классный журнал</h1>
              <p className="text-white/40 text-xs mt-0.5">{teacher.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-24 bg-white/5 border-white/10 text-white h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10">
                {CLASSES.map(c => <SelectItem key={c} value={c} className="text-white focus:bg-white/10">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs">{students.length} уч.</Badge>
            <button onClick={logout} className="text-white/30 hover:text-red-400 transition-colors p-1">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="mx-4 mt-3 grid grid-cols-4 gap-3">
          {[
            { label: "Ср. балл", value: stats.avg, icon: "TrendingUp", color: "text-indigo-300" },
            { label: "Отличники", value: stats.excellent, icon: "Star", color: "text-emerald-300" },
            { label: "Успевающих", value: Math.max(0, students.length - stats.excellent - stats.poor), icon: "Users", color: "text-blue-300" },
            { label: "Слабых", value: stats.poor, icon: "AlertTriangle", color: "text-red-300" },
          ].map(s => (
            <div key={s.label} className={`${glass} px-4 py-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name={s.icon} size={13} className={s.color} />
                <span className="text-white/40 text-xs">{s.label}</span>
              </div>
              <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="mx-4 mt-3 flex-1 flex gap-3 pb-4">
          {/* Subjects sidebar */}
          <div className={`${glass} w-44 p-3 flex flex-col gap-1`}>
            <p className="text-white/30 text-xs px-2 mb-1 uppercase tracking-wider">Предметы</p>
            {SUBJECTS.map(subj => (
              <button key={subj} onClick={() => setSelectedSubject(subj)}
                className={`text-left px-3 py-2 rounded-xl text-sm transition-all ${selectedSubject === subj ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                {subj}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className={`${glass} px-4 py-3 flex items-center justify-between flex-wrap gap-2`}>
                <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto gap-1">
                  {[
                    { value: "grades", icon: "Grid3x3", label: "Оценки" },
                    { value: "attendance", icon: "CalendarCheck", label: "Посещаемость" },
                    { value: "homework", icon: "BookMarked", label: "Д/З" },
                    { value: "corrections", icon: "FilePen", label: "Исправления" },
                  ].map(t => (
                    <TabsTrigger key={t.value} value={t.value}
                      className="text-white/50 data-[state=active]:bg-indigo-500/40 data-[state=active]:text-indigo-200 text-xs h-8">
                      <Icon name={t.icon} size={13} className="mr-1" />{t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-400/30 h-8 text-xs">
                      <Icon name="UserPlus" size={13} className="mr-1.5" /> Добавить ученика
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900/95 border-white/10 text-white backdrop-blur-xl">
                    <DialogHeader><DialogTitle className="text-white">Новый ученик — {selectedClass}</DialogTitle></DialogHeader>
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Фамилия Имя" value={newStudentName} onChange={e => setNewStudentName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        onKeyDown={e => e.key === "Enter" && addStudent()} />
                      <Button onClick={addStudent} className="bg-indigo-600 hover:bg-indigo-700 text-white">Добавить</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* GRADES */}
              <TabsContent value="grades" className="mt-0">
                <div className={`${glass} overflow-hidden`}>
                  {loadingData ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left text-white/40 text-xs px-4 py-3 w-48">Ученик</th>
                            {LESSONS.map(l => <th key={l} className="text-center text-white/40 text-xs px-1 py-3 w-10">{l + 1}</th>)}
                            <th className="text-center text-white/40 text-xs px-3 py-3 w-14">Ср.</th>
                            <th className="w-6"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student, idx) => (
                            <tr key={student.id} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                              <td className="px-4 py-2.5 text-white/80 text-sm font-medium truncate max-w-[12rem]">{student.name}</td>
                              {LESSONS.map(lessonIdx => {
                                const grade = getGrade(student.id, lessonIdx)
                                const isEditing = editingCell?.studentId === student.id && editingCell?.lessonIndex === lessonIdx
                                return (
                                  <td key={lessonIdx} className="px-0.5 py-2 text-center">
                                    {isEditing ? (
                                      <Input autoFocus
                                        className="w-9 h-8 text-center bg-indigo-900/50 border-indigo-400/50 text-white text-sm p-0"
                                        defaultValue=""
                                        onBlur={e => { saveGrade(student.id, lessonIdx, e.target.value); setEditingCell(null) }}
                                        onKeyDown={e => {
                                          if (e.key === "Enter") { saveGrade(student.id, lessonIdx, (e.target as HTMLInputElement).value); setEditingCell(null) }
                                          if (e.key === "Escape") setEditingCell(null)
                                        }} />
                                    ) : (
                                      <button onClick={() => handleGradeClick(student.id, lessonIdx)}
                                        className={`w-9 h-8 rounded-lg flex items-center justify-center mx-auto font-bold transition-all hover:bg-white/10 text-sm ${grade ? GRADE_COLORS[grade] : "text-white/20"}`}>
                                        {grade ?? "·"}
                                      </button>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="px-2 py-2 text-center">
                                {(() => {
                                  const avg = getAverage(student.id)
                                  const n = parseFloat(avg)
                                  return <span className={`font-bold text-sm ${n >= 4.5 ? "text-emerald-400" : n >= 3.5 ? "text-blue-400" : n < 3 ? "text-red-400" : "text-yellow-400"}`}>{avg}</span>
                                })()}
                              </td>
                              <td className="pr-2">
                                <button onClick={() => removeStudent(student.id)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                                  <Icon name="X" size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {!students.length && <tr><td colSpan={13} className="text-center text-white/30 py-12 text-sm">Нет учеников в классе {selectedClass}</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-4 py-2 border-t border-white/5">
                    <p className="text-white/25 text-xs">Клик по пустой ячейке — поставить оценку · Клик по оценке — исправить с указанием причины</p>
                  </div>
                </div>
              </TabsContent>

              {/* ATTENDANCE */}
              <TabsContent value="attendance" className="mt-0">
                <div className={`${glass} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-white/40 text-xs px-4 py-3 w-48">Ученик</th>
                          {LESSONS.map(l => <th key={l} className="text-center text-white/40 text-xs px-1 py-3 w-10">{l + 1}</th>)}
                          <th className="text-center text-white/40 text-xs px-3 py-3 w-16">Посещ.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, idx) => {
                          const attended = LESSONS.filter(i => getPresent(student.id, i)).length
                          return (
                            <tr key={student.id} className={`border-b border-white/5 hover:bg-white/[0.03] ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                              <td className="px-4 py-2.5 text-white/80 text-sm font-medium truncate max-w-[12rem]">{student.name}</td>
                              {LESSONS.map(lessonIdx => {
                                const present = getPresent(student.id, lessonIdx)
                                return (
                                  <td key={lessonIdx} className="px-0.5 py-2 text-center">
                                    <button onClick={() => toggleAttendance(student.id, lessonIdx)}
                                      className={`w-9 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${present ? "text-emerald-400 hover:bg-emerald-500/10" : "text-red-400 hover:bg-red-500/10 bg-red-500/5"}`}>
                                      <Icon name={present ? "Check" : "X"} size={14} />
                                    </button>
                                  </td>
                                )
                              })}
                              <td className="px-3 py-2 text-center">
                                <span className={`text-sm font-bold ${attended >= 8 ? "text-emerald-400" : attended >= 6 ? "text-yellow-400" : "text-red-400"}`}>
                                  {attended}/{LESSONS.length}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {!students.length && <tr><td colSpan={13} className="text-center text-white/30 py-12 text-sm">Нет учеников</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* HOMEWORK */}
              <TabsContent value="homework" className="mt-0">
                <div className={`${glass} p-4`}>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <Input placeholder={`Домашнее задание по ${selectedSubject}...`} value={hwDescription}
                      onChange={e => setHwDescription(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/25 min-w-48"
                      onKeyDown={e => e.key === "Enter" && addHomework()} />
                    <Input type="date" value={hwDueDate} onChange={e => setHwDueDate(e.target.value)}
                      className="w-40 bg-white/5 border-white/10 text-white/70" />
                    <Button onClick={addHomework} className="bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 border border-indigo-400/30">
                      <Icon name="Plus" size={16} />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {homework.map(hw => (
                      <div key={hw.id} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                        <Icon name="BookMarked" size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm">{hw.description}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-white/30 text-xs">Предмет: {hw.subject}</span>
                            {hw.due_date && <span className="text-indigo-400/60 text-xs flex items-center gap-1"><Icon name="Calendar" size={10} />Сдать до: {hw.due_date}</span>}
                          </div>
                        </div>
                        <button onClick={() => deleteHomework(hw.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    ))}
                    {!homework.length && <p className="text-white/30 text-sm text-center py-10">Нет домашних заданий по {selectedSubject} для {selectedClass}</p>}
                  </div>
                </div>
              </TabsContent>

              {/* CORRECTIONS */}
              <TabsContent value="corrections" className="mt-0">
                <div className={`${glass} p-4`}>
                  <div className="flex flex-col gap-2">
                    {corrections.map(c => (
                      <div key={c.id} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                        <Icon name="FilePen" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white/80 text-sm font-medium">{c.student_name}</span>
                            <span className="text-white/30 text-xs">Урок {c.lesson_index + 1}</span>
                            <span className={`text-sm font-bold ${GRADE_COLORS[c.old_grade]}`}>{c.old_grade}</span>
                            <Icon name="ArrowRight" size={12} className="text-white/30" />
                            <span className={`text-sm font-bold ${GRADE_COLORS[c.new_grade]}`}>{c.new_grade}</span>
                          </div>
                          <p className="text-white/50 text-xs mt-1">{c.reason}</p>
                          <p className="text-white/25 text-xs mt-0.5">{new Date(c.corrected_at).toLocaleString("ru")}</p>
                        </div>
                      </div>
                    ))}
                    {!corrections.length && <p className="text-white/30 text-sm text-center py-10">Исправлений по {selectedSubject} пока нет</p>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Correction modal */}
      <Dialog open={!!correctionModal} onOpenChange={open => !open && setCorrectionModal(null)}>
        <DialogContent className="bg-gray-900/95 border-white/10 text-white backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Icon name="FilePen" size={18} className="text-yellow-400" /> Исправление оценки
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <span className="text-white/50 text-sm">Текущая оценка:</span>
              <span className={`text-xl font-bold ${correctionModal ? GRADE_COLORS[correctionModal.oldGrade] : ""}`}>{correctionModal?.oldGrade}</span>
              <Icon name="ArrowRight" size={14} className="text-white/30" />
              <span className="text-white/50 text-sm">Новая оценка:</span>
              <Input value={correctionNewGrade} onChange={e => setCorrectionNewGrade(e.target.value)}
                className="w-14 text-center bg-indigo-900/40 border-indigo-400/30 text-white font-bold" maxLength={1} />
            </div>
            <div>
              <p className="text-white/50 text-sm mb-2">Причина исправления:</p>
              <div className="flex flex-col gap-2">
                {CORRECTION_REASONS.map(r => (
                  <button key={r} onClick={() => setCorrectionReason(r)}
                    className={`text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${correctionReason === r ? "bg-indigo-500/30 border-indigo-400/40 text-indigo-200" : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleCorrectionSave} disabled={!correctionReason || !correctionNewGrade}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
              Сохранить исправление
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
