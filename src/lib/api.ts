const AUTH_URL = "https://functions.poehali.dev/b4107559-57bd-400c-b7cb-8ce89c40c0a5"
const JOURNAL_URL = "https://functions.poehali.dev/b244e975-f657-4945-9a17-f58379791371"

function getToken(): string | null {
  return localStorage.getItem("auth_token")
}

async function authPost(body: object) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function journalPost(body: object) {
  const token = getToken()
  const res = await fetch(JOURNAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function journalGet(params: Record<string, string>) {
  const token = getToken()
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${JOURNAL_URL}?${qs}`, {
    headers: { "X-Auth-Token": token || "" },
  })
  return res.json()
}

export const api = {
  auth: {
    register: (email: string, name: string, password: string) =>
      authPost({ action: "register", email, name, password }),
    login: (email: string, password: string) =>
      authPost({ action: "login", email, password }),
    me: (token: string) =>
      authPost({ action: "me", token }),
    logout: (token: string) =>
      authPost({ action: "logout", token }),
  },
  students: {
    list: (cls: string) => journalGet({ action: "get_students", class: cls }),
    add: (name: string, cls: string) => journalPost({ action: "add_student", name, class: cls }),
    remove: (student_id: number) => journalPost({ action: "remove_student", student_id }),
  },
  grades: {
    list: (cls: string, subject: string) => journalGet({ action: "get_grades", class: cls, subject }),
    set: (student_id: number, subject: string, lesson_index: number, grade: number | null, reason?: string) =>
      journalPost({ action: "set_grade", student_id, subject, lesson_index, grade, reason }),
    corrections: (cls: string, subject: string) => journalGet({ action: "get_corrections", class: cls, subject }),
  },
  attendance: {
    list: (cls: string, subject: string) => journalGet({ action: "get_attendance", class: cls, subject }),
    set: (student_id: number, subject: string, lesson_index: number, present: boolean) =>
      journalPost({ action: "set_attendance", student_id, subject, lesson_index, present }),
  },
  homework: {
    list: (cls: string, subject: string) => journalGet({ action: "get_homework", class: cls, subject }),
    add: (cls: string, subject: string, description: string, due_date?: string) =>
      journalPost({ action: "add_homework", class: cls, subject, description, due_date }),
    delete: (id: number) => journalPost({ action: "delete_homework", id }),
  },
}
