
CREATE TABLE t_p26296180_data_visualization_p.teachers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p26296180_data_visualization_p.students (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES t_p26296180_data_visualization_p.teachers(id),
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p26296180_data_visualization_p.grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES t_p26296180_data_visualization_p.students(id),
  teacher_id INTEGER NOT NULL REFERENCES t_p26296180_data_visualization_p.teachers(id),
  subject TEXT NOT NULL,
  lesson_index INTEGER NOT NULL,
  grade INTEGER CHECK (grade >= 1 AND grade <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, subject, lesson_index)
);

CREATE TABLE t_p26296180_data_visualization_p.grade_corrections (
  id SERIAL PRIMARY KEY,
  grade_id INTEGER NOT NULL REFERENCES t_p26296180_data_visualization_p.grades(id),
  old_grade INTEGER,
  new_grade INTEGER,
  reason TEXT NOT NULL,
  corrected_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p26296180_data_visualization_p.attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES t_p26296180_data_visualization_p.students(id),
  teacher_id INTEGER NOT NULL REFERENCES t_p26296180_data_visualization_p.teachers(id),
  subject TEXT NOT NULL,
  lesson_index INTEGER NOT NULL,
  present BOOLEAN DEFAULT TRUE,
  UNIQUE(student_id, subject, lesson_index)
);

CREATE TABLE t_p26296180_data_visualization_p.homework (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES t_p26296180_data_visualization_p.teachers(id),
  class TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p26296180_data_visualization_p.sessions (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES t_p26296180_data_visualization_p.teachers(id),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
