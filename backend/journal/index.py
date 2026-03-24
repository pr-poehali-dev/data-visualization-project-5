"""API журнала: ученики, оценки, исправления, посещаемость, домашние задания."""
import json, os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p26296180_data_visualization_p")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_teacher(cur, token):
    cur.execute(f"""
        SELECT t.id FROM {SCHEMA}.teachers t
        JOIN {SCHEMA}.sessions s ON s.teacher_id = t.id
        WHERE s.token = %s
    """, (token,))
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = event.get("headers", {}).get("X-Auth-Token") or event.get("headers", {}).get("x-auth-token")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}
    action = body.get("action") or params.get("action")
    method = event.get("httpMethod", "GET")

    conn = get_conn()
    cur = conn.cursor()

    teacher_id = get_teacher(cur, token)
    if not teacher_id:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    # --- STUDENTS ---
    if action == "get_students":
        class_name = params.get("class", body.get("class"))
        if class_name:
            cur.execute(f"SELECT id, name, class FROM {SCHEMA}.students WHERE teacher_id = %s AND class = %s ORDER BY name", (teacher_id, class_name))
        else:
            cur.execute(f"SELECT id, name, class FROM {SCHEMA}.students WHERE teacher_id = %s ORDER BY class, name", (teacher_id,))
        rows = cur.fetchall()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"students": [{"id": r[0], "name": r[1], "class": r[2]} for r in rows]})}

    if action == "add_student":
        name = body.get("name", "").strip()
        class_name = body.get("class", "").strip()
        if not name or not class_name:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите имя и класс"})}
        cur.execute(f"INSERT INTO {SCHEMA}.students (teacher_id, name, class) VALUES (%s, %s, %s) RETURNING id", (teacher_id, name, class_name))
        student_id = cur.fetchone()[0]
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"student": {"id": student_id, "name": name, "class": class_name}})}

    if action == "remove_student":
        student_id = body.get("student_id")
        cur.execute(f"DELETE FROM {SCHEMA}.attendance WHERE student_id = %s AND teacher_id = %s", (student_id, teacher_id))
        cur.execute(f"""
            DELETE FROM {SCHEMA}.grade_corrections WHERE grade_id IN (
                SELECT id FROM {SCHEMA}.grades WHERE student_id = %s AND teacher_id = %s
            )
        """, (student_id, teacher_id))
        cur.execute(f"DELETE FROM {SCHEMA}.grades WHERE student_id = %s AND teacher_id = %s", (student_id, teacher_id))
        cur.execute(f"DELETE FROM {SCHEMA}.students WHERE id = %s AND teacher_id = %s", (student_id, teacher_id))
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # --- GRADES ---
    if action == "get_grades":
        class_name = params.get("class", body.get("class"))
        subject = params.get("subject", body.get("subject"))
        cur.execute(f"""
            SELECT g.student_id, g.lesson_index, g.grade, g.id
            FROM {SCHEMA}.grades g
            JOIN {SCHEMA}.students s ON s.id = g.student_id
            WHERE g.teacher_id = %s AND s.class = %s AND g.subject = %s
        """, (teacher_id, class_name, subject))
        rows = cur.fetchall()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"grades": [{"student_id": r[0], "lesson_index": r[1], "grade": r[2], "grade_id": r[3]} for r in rows]})}

    if action == "set_grade":
        student_id = body.get("student_id")
        subject = body.get("subject")
        lesson_index = body.get("lesson_index")
        grade = body.get("grade")
        reason = body.get("reason")

        cur.execute(f"SELECT id, grade FROM {SCHEMA}.grades WHERE student_id = %s AND subject = %s AND lesson_index = %s AND teacher_id = %s",
                    (student_id, subject, lesson_index, teacher_id))
        existing = cur.fetchone()

        if existing:
            old_grade_id, old_grade = existing
            cur.execute(f"UPDATE {SCHEMA}.grades SET grade = %s, updated_at = NOW() WHERE id = %s", (grade, old_grade_id))
            if reason:
                cur.execute(f"INSERT INTO {SCHEMA}.grade_corrections (grade_id, old_grade, new_grade, reason) VALUES (%s, %s, %s, %s)",
                            (old_grade_id, old_grade, grade, reason))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "grade_id": old_grade_id})}
        else:
            cur.execute(f"INSERT INTO {SCHEMA}.grades (student_id, teacher_id, subject, lesson_index, grade) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                        (student_id, teacher_id, subject, lesson_index, grade))
            grade_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "grade_id": grade_id})}

    if action == "get_corrections":
        subject = params.get("subject", body.get("subject"))
        class_name = params.get("class", body.get("class"))
        cur.execute(f"""
            SELECT gc.id, s.name, g.subject, g.lesson_index, gc.old_grade, gc.new_grade, gc.reason, gc.corrected_at
            FROM {SCHEMA}.grade_corrections gc
            JOIN {SCHEMA}.grades g ON g.id = gc.grade_id
            JOIN {SCHEMA}.students s ON s.id = g.student_id
            WHERE g.teacher_id = %s AND s.class = %s AND g.subject = %s
            ORDER BY gc.corrected_at DESC
        """, (teacher_id, class_name, subject))
        rows = cur.fetchall()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"corrections": [
            {"id": r[0], "student_name": r[1], "subject": r[2], "lesson_index": r[3],
             "old_grade": r[4], "new_grade": r[5], "reason": r[6], "corrected_at": str(r[7])} for r in rows
        ]})}

    # --- ATTENDANCE ---
    if action == "get_attendance":
        class_name = params.get("class", body.get("class"))
        subject = params.get("subject", body.get("subject"))
        cur.execute(f"""
            SELECT a.student_id, a.lesson_index, a.present
            FROM {SCHEMA}.attendance a
            JOIN {SCHEMA}.students s ON s.id = a.student_id
            WHERE a.teacher_id = %s AND s.class = %s AND a.subject = %s
        """, (teacher_id, class_name, subject))
        rows = cur.fetchall()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"attendance": [{"student_id": r[0], "lesson_index": r[1], "present": r[2]} for r in rows]})}

    if action == "set_attendance":
        student_id = body.get("student_id")
        subject = body.get("subject")
        lesson_index = body.get("lesson_index")
        present = body.get("present", True)
        cur.execute(f"""
            INSERT INTO {SCHEMA}.attendance (student_id, teacher_id, subject, lesson_index, present)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (student_id, subject, lesson_index) DO UPDATE SET present = EXCLUDED.present
        """, (student_id, teacher_id, subject, lesson_index, present))
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # --- HOMEWORK ---
    if action == "get_homework":
        class_name = params.get("class", body.get("class"))
        subject = params.get("subject", body.get("subject", ""))
        if subject:
            cur.execute(f"SELECT id, class, subject, description, due_date, created_at FROM {SCHEMA}.homework WHERE teacher_id = %s AND class = %s AND subject = %s ORDER BY created_at DESC",
                        (teacher_id, class_name, subject))
        else:
            cur.execute(f"SELECT id, class, subject, description, due_date, created_at FROM {SCHEMA}.homework WHERE teacher_id = %s AND class = %s ORDER BY created_at DESC",
                        (teacher_id, class_name))
        rows = cur.fetchall()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"homework": [
            {"id": r[0], "class": r[1], "subject": r[2], "description": r[3], "due_date": str(r[4]) if r[4] else None, "created_at": str(r[5])} for r in rows
        ]})}

    if action == "add_homework":
        class_name = body.get("class", "").strip()
        subject = body.get("subject", "").strip()
        description = body.get("description", "").strip()
        due_date = body.get("due_date")
        if not class_name or not subject or not description:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
        cur.execute(f"INSERT INTO {SCHEMA}.homework (teacher_id, class, subject, description, due_date) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (teacher_id, class_name, subject, description, due_date or None))
        hw_id = cur.fetchone()[0]
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "id": hw_id})}

    if action == "delete_homework":
        hw_id = body.get("id")
        cur.execute(f"DELETE FROM {SCHEMA}.homework WHERE id = %s AND teacher_id = %s", (hw_id, teacher_id))
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестное действие"})}
