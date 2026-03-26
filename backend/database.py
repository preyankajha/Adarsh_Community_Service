import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env from the same directory as this file
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv() # Fallback to default behavior

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "sanatan_swabhiman_samiti")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

with open("db_init.log", "a") as f:
    import datetime
    masked_uri = MONGO_URI.split("@")[-1] if "@" in MONGO_URI else MONGO_URI
    f.write(f"[{datetime.datetime.now()}] Connected to DB: {DB_NAME} | URI: {masked_uri}\n")

async def get_database():
    return db

# Collections
users_collection = db.get_collection("users")
families_collection = db.get_collection("families")
assistance_requests_collection = db.get_collection("assistance_requests")
contributions_collection = db.get_collection("contributions")
expenses_collection = db.get_collection("expenses")
notices_collection = db.get_collection("notices")
rules_collection = db.get_collection("rules")
audit_logs_collection = db.get_collection("audit_logs")
inquiries_collection = db.get_collection("inquiries")
elections_collection = db.get_collection("elections")
election_posts_collection = db.get_collection("election_posts")
candidates_collection = db.get_collection("candidates")
votes_collection = db.get_collection("votes")
strikes_collection = db.get_collection("strikes")
strike_interactions_collection = db.get_collection("strike_interactions")
performance_ratings_collection = db.get_collection("performance_ratings")
committee_history_collection = db.get_collection("committee_history")
recommendations_collection = db.get_collection("recommendations")
family_update_requests_collection = db.get_collection("family_update_requests")
collection_campaigns_collection = db.get_collection("collection_campaigns")
contribution_proofs_collection = db.get_collection("contribution_proofs")
communities_collection = db.get_collection("communities")

