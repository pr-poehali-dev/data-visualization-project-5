"""Авторизация учителей: регистрация и вход в систему."""
import json, os, hashlib, secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p26296180_data_visualization_p")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action")

    conn = get_conn()
    cur = conn.cursor()

    if action == "register":
        email = body.get("email", "").strip().lower()
        name = body.get("name", "").strip()
        password = body.get("password", "")
        if not email or not name or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
        if len(password) < 6:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}
        cur.execute(f"SELECT id FROM {SCHEMA}.teachers WHERE email = %s", (email,))
        if cur.fetchone():
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Email уже зарегистрирован"})}
        pw_hash = hash_password(password)
        cur.execute(f"INSERT INTO {SCHEMA}.teachers (email, name, password_hash) VALUES (%s, %s, %s) RETURNING id, name",
                    (email, name, pw_hash))
        teacher_id, teacher_name = cur.fetchone()
        token = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (teacher_id, token) VALUES (%s, %s)", (teacher_id, token))
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token, "teacher": {"id": teacher_id, "name": teacher_name, "email": email}})}

    if action == "login":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        pw_hash = hash_password(password)
        cur.execute(f"SELECT id, name FROM {SCHEMA}.teachers WHERE email = %s AND password_hash = %s", (email, pw_hash))
        row = cur.fetchone()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный email или пароль"})}
        teacher_id, teacher_name = row
        token = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (teacher_id, token) VALUES (%s, %s)", (teacher_id, token))
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token, "teacher": {"id": teacher_id, "name": teacher_name, "email": email}})}

    if action == "me":
        token = body.get("token") or event.get("headers", {}).get("X-Auth-Token")
        if not token:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
        cur.execute(f"""
            SELECT t.id, t.name, t.email FROM {SCHEMA}.teachers t
            JOIN {SCHEMA}.sessions s ON s.teacher_id = t.id
            WHERE s.token = %s
        """, (token,))
        row = cur.fetchone()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия не найдена"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"teacher": {"id": row[0], "name": row[1], "email": row[2]}})}

    if action == "logout":
        token = body.get("token")
        if token:
            cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE token = %s", (token,))
            conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестное действие"})}
