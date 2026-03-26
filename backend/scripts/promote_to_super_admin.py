from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Connect to MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://karan:karan@cluster0.1j4p0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
client = MongoClient(MONGO_URI)
db = client['jagdamba_samiti']
users_collection = db['users']

def promote_user():
    print("--- 👑 Promote User to Super Admin ---")
    phone = input("Enter the Mobile Number of the user to promote: ").strip()

    user = users_collection.find_one({"phone": phone})

    if not user:
        print(f"❌ User with mobile {phone} not found!")
        return

    print(f"Found User: {user.get('name', 'Unknown User')} (Current Role: {user.get('role')})")
    
    confirm = input("Are you sure you want to make this user a SUPER ADMIN? (yes/no): ").lower()
    
    if confirm == 'yes':
        # Update connection
        users_collection.update_one(
            {"phone": phone}, 
            {
                "$set": {
                    "role": "super_admin",
                    "position": "none"  # Ensure no conflicting position initially
                }
            }
        )
        print(f"✅ SUCCESS! User {user.get('name')} is now a Super Admin.")
        print("👉 You can now log in as this user and assign President, Treasurer, etc. from the dashboard.")
    else:
        print("❌ Operation cancelled.")

if __name__ == "__main__":
    promote_user()
