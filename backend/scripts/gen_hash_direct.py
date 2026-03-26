import bcrypt
password = b"admin123"
# Hash a password for the first time
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode('utf-8'))
