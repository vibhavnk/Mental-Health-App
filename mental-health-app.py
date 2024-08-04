import streamlit as st
import sqlite3
import bcrypt
import jwt
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Constants
SECRET_KEY = 'your_secret_key'
EMAIL_SECRET = 'your_email_secret_key'
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
SMTP_EMAIL = "your_email@gmail.com"
SMTP_PASSWORD = "your_app_password"

# Database setup
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_verified BOOLEAN DEFAULT 0,
            profile TEXT
        )
    ''')
    conn.commit()
    conn.close()

# Helper functions
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(hashed_password, password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def send_verification_email(email, token):
    url = f"http://localhost:8501/?token={token}"
    msg = MIMEMultipart()
    msg['From'] = SMTP_EMAIL
    msg['To'] = email
    msg['Subject'] = 'Verify your email'
    body = f'Please click this link to verify your email: <a href="{url}">{url}</a>'
    msg.attach(MIMEText(body, 'html'))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, email, msg.as_string())

# Streamlit app
def main():
    st.title("Welcome to the mental health app")

    menu = ["Home", "Login", "SignUp", "Verify"]
    choice = st.sidebar.selectbox("Menu", menu)

    if choice == "Home":
        st.subheader("Home")
    
    elif choice == "Login":
        st.subheader("Login Section")
        
        email = st.text_input("Email")
        password = st.text_input("Password", type='password')
        
        if st.button("Login"):
            if login_user(email, password):
                st.success(f"Logged In as {email}")
                st.session_state.logged_in = True
                st.session_state.email = email
            else:
                st.warning("Incorrect Email/Password or Email not verified")
    
    elif choice == "SignUp":
        st.subheader("Create New Account")
        
        new_user = st.text_input("Email")
        new_password = st.text_input("Password", type='password')
        
        if st.button("Signup"):
            if signup_user(new_user, new_password):
                st.success("You have successfully created a valid Account. Check your email to verify.")
            else:
                st.warning("User already exists. Try logging in.")
    
    elif choice == "Verify":
        st.subheader("Verify your Email")
        
        token = st.text_input("Enter the token from your email")
        
        if st.button("Verify"):
            if verify_email(token):
                st.success("Email verified successfully. You can now log in.")
            else:
                st.warning("Verification failed. Token may be invalid or expired.")

def signup_user(email, password):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    
    c.execute("SELECT * FROM users WHERE email=?", (email,))
    if c.fetchone():
        return False
    
    hashed_password = hash_password(password)
    c.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed_password))
    conn.commit()
    
    user_id = c.lastrowid
    token = jwt.encode({'user_id': user_id}, EMAIL_SECRET, algorithm='HS256')
    send_verification_email(email, token)
    
    conn.close()
    return True

def login_user(email, password):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    
    c.execute("SELECT * FROM users WHERE email=?", (email,))
    user = c.fetchone()
    
    if user and check_password(user[2], password) and user[3]:
        return True
    return False

def verify_email(token):
    try:
        decoded = jwt.decode(token, EMAIL_SECRET, algorithms=['HS256'])
        user_id = decoded['user_id']
        
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        
        c.execute("UPDATE users SET is_verified=1 WHERE id=?", (user_id,))
        conn.commit()
        conn.close()
        return True
    except:
        return False

if __name__ == '__main__':
    init_db()
    main()
