import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Icon from "@/components/ui/icon"

const SUBJECTS = ["Математика", "Русский язык", "Физика", "История", "Биология", "Химия", "Литература"]
const CLASSES = ["7А", "7Б", "8А", "8Б", "9А", "9Б", "10А", "11А"]

const GRADE_COLORS: Record<number, string> = {
  5: "text-emerald-400",
  4: "text-blue-400",
  3: "text-yellow-400",
  2: "text-red-400",
}

interface Student {
  id: number
  name: string
  grades: Record<string, (number | null)[]>
  attendance: Record<string, boolean[]>
}

interface GradeEntry {
  studentId: number
  subject: string
  lessonIndex: number
  grade: number | null
}

const LESSONS = Array.from({ length: 10 }, (_, i) => `${i + 1}`)

const initialStudents: Student[] = [
  { id: 1, name: "Иванов Алексей", grades: {}, attendance: {} },
  { id: 2, name: "Петрова Мария", grades: {}, attendance: {} },
  { id: 3, name: "Сидоров Дмитрий", grades: {}, attendance: {} },
  { id: 4, name: "Козлова Анна", grades: {}, attendance: {} },
  { id: 5, name: "Новиков Кирилл", grades: {}, attendance: {} },
  { id: 6, name: "Морозова Екатерина", grades: {}, attendance: {} },
  { id: 7, name: "Волков Никита", grades: {}, attendance: {} },
  { id: 8, name: "Зайцева Полина", grades: {}, attendance: {} },
]

function generateInitialGrades(students: Student[], subject: string): Student[] {
  return students.map(s => ({
    ...s,
    grades: {
      ...s.grades,
      [subject]: LESSONS.map(() => Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 3 : null),
    },
    attendance: {
      ...s.attendance,
      [subject]: LESSONS.map(() => Math.random() > 0.15),
    },
  }))
}

let seededStudents = initialStudents
SUBJECTS.forEach(subj => {
  seededStudents = generateInitialGrades(seededStudents, subj)
})

export default function Index() {
  const [students, setStudents] = useState<Student[]>(seededStudents)
  const [selectedClass, setSelectedClass] = useState("9А")
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0])
  const [activeTab, setActiveTab] = useState("grades")
  const [editingCell, setEditingCell] = useState<{ studentId: number; lessonIndex: number } | null>(null)
  const [newStudentName, setNewStudentName] = useState("")
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [notes, setNotes] = useState<{ id: number; text: string; date: string }[]>([
    { id: 1, text: "Контрольная работа 15 апреля", date: "2024-03-24" },
    { id: 2, text: "Родительское собрание 20 апреля", date: "2024-03-24" },
  ])

  const getGrade = (student: Student, lessonIndex: number): number | null => {
    return student.grades[selectedSubject]?.[lessonIndex] ?? null
  }

  const getAttendance = (student: Student, lessonIndex: number): boolean => {
    return student.attendance[selectedSubject]?.[lessonIndex] ?? true
  }

  const setGrade = (studentId: number, lessonIndex: number, value: string) => {
    const grade = value === "" ? null : parseInt(value)
    if (grade !== null && (grade < 1 || grade > 5)) return
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      const grades = { ...s.grades }
      const subjectGrades = [...(grades[selectedSubject] || LESSONS.map(() => null))]
      subjectGrades[lessonIndex] = grade
      grades[selectedSubject] = subjectGrades
      return { ...s, grades }
    }))
  }

  const toggleAttendance = (studentId: number, lessonIndex: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      const attendance = { ...s.attendance }
      const subjectAttendance = [...(attendance[selectedSubject] || LESSONS.map(() => true))]
      subjectAttendance[lessonIndex] = !subjectAttendance[lessonIndex]
      attendance[selectedSubject] = subjectAttendance
      return { ...s, attendance }
    }))
  }

  const getAverage = (student: Student): string => {
    const grades = (student.grades[selectedSubject] || []).filter(g => g !== null) as number[]
    if (!grades.length) return "—"
    return (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)
  }

  const getClassStats = () => {
    const allGrades = students.flatMap(s => (s.grades[selectedSubject] || []).filter(g => g !== null)) as number[]
    if (!allGrades.length) return { avg: "—", excellent: 0, good: 0, poor: 0 }
    const avg = (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(1)
    const excellent = students.filter(s => {
      const g = (s.grades[selectedSubject] || []).filter(x => x !== null) as number[]
      return g.length && g.reduce((a, b) => a + b, 0) / g.length >= 4.5
    }).length
    const poor = students.filter(s => {
      const g = (s.grades[selectedSubject] || []).filter(x => x !== null) as number[]
      return g.length && g.reduce((a, b) => a + b, 0) / g.length < 3
    }).length
    const good = students.length - excellent - poor
    return { avg, excellent, good, poor }
  }

  const addStudent = () => {
    if (!newStudentName.trim()) return
    const newStudent: Student = {
      id: Date.now(),
      name: newStudentName.trim(),
      grades: Object.fromEntries(SUBJECTS.map(s => [s, LESSONS.map(() => null)])),
      attendance: Object.fromEntries(SUBJECTS.map(s => [s, LESSONS.map(() => true)])),
    }
    setStudents(prev => [...prev, newStudent])
    setNewStudentName("")
    setAddStudentOpen(false)
  }

  const removeStudent = (id: number) => {
    setStudents(prev => prev.filter(s => s.id !== id))
  }

  const addNote = () => {
    if (!noteText.trim()) return
    setNotes(prev => [...prev, { id: Date.now(), text: noteText.trim(), date: new Date().toISOString().split("T")[0] }])
    setNoteText("")
  }

  const stats = getClassStats()

  const glassCard = "bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl"

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="neonPulse1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,1)" />
                <stop offset="30%" stopColor="rgba(99,102,241,1)" />
                <stop offset="70%" stopColor="rgba(79,70,229,0.8)" />
                <stop offset="100%" stopColor="rgba(79,70,229,0)" />
              </radialGradient>
              <radialGradient id="neonPulse2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                <stop offset="25%" stopColor="rgba(139,92,246,0.9)" />
                <stop offset="60%" stopColor="rgba(124,58,237,0.7)" />
                <stop offset="100%" stopColor="rgba(124,58,237,0)" />
              </radialGradient>
              <radialGradient id="neonPulse3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,1)" />
                <stop offset="35%" stopColor="rgba(167,139,250,1)" />
                <stop offset="75%" stopColor="rgba(139,92,246,0.6)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0)" />
              </radialGradient>
              <linearGradient id="threadFade1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,1)" />
                <stop offset="15%" stopColor="rgba(99,102,241,0.8)" />
                <stop offset="85%" stopColor="rgba(99,102,241,0.8)" />
                <stop offset="100%" stopColor="rgba(0,0,0,1)" />
              </linearGradient>
              <linearGradient id="threadFade2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,1)" />
                <stop offset="12%" stopColor="rgba(139,92,246,0.7)" />
                <stop offset="88%" stopColor="rgba(139,92,246,0.7)" />
                <stop offset="100%" stopColor="rgba(0,0,0,1)" />
              </linearGradient>
              <linearGradient id="threadFade3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,1)" />
                <stop offset="18%" stopColor="rgba(167,139,250,0.8)" />
                <stop offset="82%" stopColor="rgba(167,139,250,0.8)" />
                <stop offset="100%" stopColor="rgba(0,0,0,1)" />
              </linearGradient>
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path id="thread1" d="M50 720 Q200 590 350 540 Q500 490 650 520 Q800 550 950 460 Q1100 370 1200 340" stroke="url(#threadFade1)" strokeWidth="0.8" fill="none" opacity="0.8" />
            <circle r="2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="4s" repeatCount="indefinite"><mpath href="#thread1" /></animateMotion>
            </circle>
            <path id="thread2" d="M80 730 Q250 620 400 570 Q550 520 700 550 Q850 580 1000 490 Q1150 400 1300 370" stroke="url(#threadFade2)" strokeWidth="1.5" fill="none" opacity="0.7" />
            <circle r="3" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="5s" repeatCount="indefinite"><mpath href="#thread2" /></animateMotion>
            </circle>
            <path id="thread3" d="M20 700 Q180 560 320 510 Q460 460 600 500 Q740 540 900 430 Q1050 320 1180 310" stroke="url(#threadFade3)" strokeWidth="1.2" fill="none" opacity="0.6" />
            <circle r="2.5" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
              <animateMotion dur="6s" repeatCount="indefinite"><mpath href="#thread3" /></animateMotion>
            </circle>
            <path id="thread4" d="M0 680 Q150 580 300 540 Q480 490 620 530 Q760 570 920 470 Q1080 370 1200 360" stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.5" />
            <circle r="1.5" fill="url(#neonPulse1)" opacity="0.8" filter="url(#neonGlow)">
              <animateMotion dur="7s" repeatCount="indefinite"><mpath href="#thread4" /></animateMotion>
            </circle>
            <path id="thread5" d="M100 760 Q280 640 430 590 Q580 540 720 560 Q860 580 1010 500 Q1160 420 1250 390" stroke="url(#threadFade2)" strokeWidth="2" fill="none" opacity="0.4" />
            <circle r="4" fill="url(#neonPulse2)" opacity="0.9" filter="url(#neonGlow)">
              <animateMotion dur="3.5s" repeatCount="indefinite"><mpath href="#thread5" /></animateMotion>
            </circle>
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-violet-950/30" />
      </div>

      {/* App content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`mx-4 mt-4 px-6 py-4 ${glassCard} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Icon name="BookOpen" size={18} className="text-indigo-300" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Классный журнал</h1>
              <p className="text-white/40 text-xs mt-0.5">Электронный дневник учителя</p>
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
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs">
              {students.length} учеников
            </Badge>
          </div>
        </header>

        {/* Stats row */}
        <div className="mx-4 mt-3 grid grid-cols-4 gap-3">
          {[
            { label: "Ср. балл класса", value: stats.avg, icon: "TrendingUp", color: "text-indigo-300" },
            { label: "Отличники", value: stats.excellent, icon: "Star", color: "text-emerald-300" },
            { label: "Успевающих", value: stats.good, icon: "Users", color: "text-blue-300" },
            { label: "Слабых", value: stats.poor, icon: "AlertTriangle", color: "text-red-300" },
          ].map(stat => (
            <div key={stat.label} className={`${glassCard} px-4 py-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name={stat.icon} size={14} className={stat.color} />
                <span className="text-white/40 text-xs">{stat.label}</span>
              </div>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="mx-4 mt-3 flex-1 flex gap-3 pb-4">
          {/* Sidebar subjects */}
          <div className={`${glassCard} w-44 p-3 flex flex-col gap-1`}>
            <p className="text-white/40 text-xs px-2 mb-1 uppercase tracking-wider">Предметы</p>
            {SUBJECTS.map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  selectedSubject === subj
                    ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Main panel */}
          <div className="flex-1 flex flex-col gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className={`${glassCard} px-4 py-3 flex items-center justify-between`}>
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger value="grades" className="text-white/60 data-[state=active]:bg-indigo-500/40 data-[state=active]:text-indigo-200 text-sm">
                    <Icon name="Grid3x3" size={14} className="mr-1.5" /> Оценки
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="text-white/60 data-[state=active]:bg-indigo-500/40 data-[state=active]:text-indigo-200 text-sm">
                    <Icon name="CalendarCheck" size={14} className="mr-1.5" /> Посещаемость
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-white/60 data-[state=active]:bg-indigo-500/40 data-[state=active]:text-indigo-200 text-sm">
                    <Icon name="StickyNote" size={14} className="mr-1.5" /> Заметки
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-400/30 h-8 text-xs">
                        <Icon name="UserPlus" size={13} className="mr-1.5" /> Добавить ученика
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900/95 border-white/10 text-white backdrop-blur-xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">Новый ученик</DialogTitle>
                      </DialogHeader>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Фамилия Имя"
                          value={newStudentName}
                          onChange={e => setNewStudentName(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          onKeyDown={e => e.key === "Enter" && addStudent()}
                        />
                        <Button onClick={addStudent} className="bg-indigo-600 hover:bg-indigo-700 text-white">Добавить</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Grades tab */}
              <TabsContent value="grades" className="mt-0">
                <div className={`${glassCard} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-white/40 text-xs px-4 py-3 w-44">Ученик</th>
                          {LESSONS.map(l => (
                            <th key={l} className="text-center text-white/40 text-xs px-2 py-3 w-10">
                              {l}
                            </th>
                          ))}
                          <th className="text-center text-white/40 text-xs px-3 py-3 w-16">Ср.</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, idx) => (
                          <tr key={student.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                            <td className="px-4 py-2.5 text-white/80 text-sm font-medium">{student.name}</td>
                            {LESSONS.map((_, lessonIdx) => {
                              const grade = getGrade(student, lessonIdx)
                              const isEditing = editingCell?.studentId === student.id && editingCell?.lessonIndex === lessonIdx
                              return (
                                <td key={lessonIdx} className="px-1 py-2 text-center">
                                  {isEditing ? (
                                    <Input
                                      autoFocus
                                      className="w-9 h-8 text-center bg-indigo-900/50 border-indigo-400/50 text-white text-sm p-0"
                                      defaultValue={grade?.toString() || ""}
                                      onBlur={e => { setGrade(student.id, lessonIdx, e.target.value); setEditingCell(null) }}
                                      onKeyDown={e => {
                                        if (e.key === "Enter") { setGrade(student.id, lessonIdx, (e.target as HTMLInputElement).value); setEditingCell(null) }
                                        if (e.key === "Escape") setEditingCell(null)
                                      }}
                                    />
                                  ) : (
                                    <button
                                      onClick={() => setEditingCell({ studentId: student.id, lessonIndex: lessonIdx })}
                                      className={`w-9 h-8 rounded-lg flex items-center justify-center mx-auto font-bold transition-all hover:bg-white/10 ${
                                        grade ? GRADE_COLORS[grade] : "text-white/20"
                                      }`}
                                    >
                                      {grade || "·"}
                                    </button>
                                  )}
                                </td>
                              )
                            })}
                            <td className="px-3 py-2 text-center">
                              <span className={`font-bold text-sm ${
                                parseFloat(getAverage(student)) >= 4.5 ? "text-emerald-400" :
                                parseFloat(getAverage(student)) >= 3.5 ? "text-blue-400" :
                                parseFloat(getAverage(student)) < 3 ? "text-red-400" : "text-yellow-400"
                              }`}>{getAverage(student)}</span>
                            </td>
                            <td className="pr-2">
                              <button onClick={() => removeStudent(student.id)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                                <Icon name="X" size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 border-t border-white/5">
                    <p className="text-white/30 text-xs">Нажмите на ячейку для редактирования оценки (1–5)</p>
                  </div>
                </div>
              </TabsContent>

              {/* Attendance tab */}
              <TabsContent value="attendance" className="mt-0">
                <div className={`${glassCard} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-white/40 text-xs px-4 py-3 w-44">Ученик</th>
                          {LESSONS.map(l => (
                            <th key={l} className="text-center text-white/40 text-xs px-2 py-3 w-10">{l}</th>
                          ))}
                          <th className="text-center text-white/40 text-xs px-3 py-3 w-20">Посещ.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, idx) => {
                          const attended = LESSONS.filter((_, i) => getAttendance(student, i)).length
                          return (
                            <tr key={student.id} className={`border-b border-white/5 hover:bg-white/3 ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                              <td className="px-4 py-2.5 text-white/80 text-sm font-medium">{student.name}</td>
                              {LESSONS.map((_, lessonIdx) => {
                                const present = getAttendance(student, lessonIdx)
                                return (
                                  <td key={lessonIdx} className="px-1 py-2 text-center">
                                    <button
                                      onClick={() => toggleAttendance(student.id, lessonIdx)}
                                      className={`w-9 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                        present ? "text-emerald-400 hover:bg-emerald-500/10" : "text-red-400 hover:bg-red-500/10"
                                      }`}
                                    >
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
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 border-t border-white/5">
                    <p className="text-white/30 text-xs">Нажмите на значок для отметки присутствия/отсутствия</p>
                  </div>
                </div>
              </TabsContent>

              {/* Notes tab */}
              <TabsContent value="notes" className="mt-0">
                <div className={`${glassCard} p-4`}>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Добавить заметку (контрольная, событие, напоминание...)"
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      onKeyDown={e => e.key === "Enter" && addNote()}
                    />
                    <Button onClick={addNote} className="bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 border border-indigo-400/30">
                      <Icon name="Plus" size={16} />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {notes.map(note => (
                      <div key={note.id} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                        <Icon name="StickyNote" size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-white/80 text-sm">{note.text}</p>
                          <p className="text-white/30 text-xs mt-1">{note.date}</p>
                        </div>
                        <button onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))} className="text-white/20 hover:text-red-400 transition-colors">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <p className="text-white/30 text-sm text-center py-8">Заметок пока нет</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}