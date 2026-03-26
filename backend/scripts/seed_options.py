from database import db
import asyncio

async def seed_form_options():
    options = [
        {
            "category": "family_type",
            "options": [
                {"value": "Nuclear", "hi": "एकल परिवार", "en": "Nuclear"},
                {"value": "Joint", "hi": "संयुक्त परिवार", "en": "Joint"},
                {"value": "Other", "hi": "अन्य", "en": "Other"}
            ]
        },
        {
            "category": "gender",
            "options": [
                {"value": "Male", "hi": "पुरुष", "en": "Male"},
                {"value": "Female", "hi": "महिला", "en": "Female"},
                {"value": "Other", "hi": "अन्य", "en": "Other"}
            ]
        },
        {
            "category": "marital_status",
            "options": [
                {"value": "Married", "hi": "विवाहित", "en": "Married"},
                {"value": "Single", "hi": "अविवाहित", "en": "Single"},
                {"value": "Divorced", "hi": "तलाकशुदा", "en": "Divorced"},
                {"value": "Widowed", "hi": "विधवा/विधुर", "en": "Widowed"}
            ]
        },
        {
            "category": "blood_group",
            "options": [
                {"value": "A+", "hi": "A+", "en": "A+"},
                {"value": "A-", "hi": "A-", "en": "A-"},
                {"value": "B+", "hi": "B+", "en": "B+"},
                {"value": "B-", "hi": "B-", "en": "B-"},
                {"value": "AB+", "hi": "AB+", "en": "AB+"},
                {"value": "AB-", "hi": "AB-", "en": "AB-"},
                {"value": "O+", "hi": "O+", "en": "O+"},
                {"value": "O-", "hi": "O-", "en": "O-"}
            ]
        },
        {
            "category": "relation",
            "options": [
                {"value": "Spouse", "hi": "जीवनसाथी", "en": "Spouse"},
                {"value": "Son", "hi": "पुत्र", "en": "Son"},
                {"value": "Daughter", "hi": "पुत्री", "en": "Daughter"},
                {"value": "Father", "hi": "पिता", "en": "Father"},
                {"value": "Mother", "hi": "माता", "en": "Mother"},
                {"value": "Brother", "hi": "भाई", "en": "Brother"},
                {"value": "Sister", "hi": "बहन", "en": "Sister"},
                {"value": "Other", "hi": "अन्य", "en": "Other"}
            ]
        },
        {
            "category": "occupation",
            "options": [
                {"value": "Private Job", "hi": "निजी नौकरी", "en": "Private Job"},
                {"value": "Government Job", "hi": "सरकारी नौकरी", "en": "Government Job"},
                {"value": "Business", "hi": "व्यवसाय", "en": "Business"},
                {"value": "Self Employed", "hi": "स्वरोजगार", "en": "Self Employed"},
                {"value": "Farmer", "hi": "किसान", "en": "Farmer"},
                {"value": "Labor", "hi": "मजदूर", "en": "Labor"},
                {"value": "Student", "hi": "विद्यार्थी", "en": "Student"},
                {"value": "Home Maker", "hi": "गृहिणी", "en": "Home Maker"},
                {"value": "Retired", "hi": "सेवानिवृत्त", "en": "Retired"},
                {"value": "Other", "hi": "अन्य", "en": "Other"}
            ]
        },
        {
            "category": "education_level",
            "options": [
                {"value": "Primary", "hi": "प्राथमिक (कक्षा 5)", "en": "Primary"},
                {"value": "Middle", "hi": "मध्यम (कक्षा 8)", "en": "Middle"},
                {"value": "High School", "hi": "हाई स्कूल (10वीं)", "en": "High School"},
                {"value": "Intermediate", "hi": "इंटरमीडिएट (12वीं)", "en": "Intermediate"},
                {"value": "Graduate", "hi": "स्नातक", "en": "Graduate"},
                {"value": "Post Graduate", "hi": "स्नातकोत्तर", "en": "Post Graduate"},
                {"value": "Doctorate", "hi": "डॉक्टरेट", "en": "Doctorate"},
                {"value": "Studying", "hi": "अध्ययनरत", "en": "Studying"},
                {"value": "Uneducated", "hi": "अशिक्षित", "en": "Uneducated"},
                {"value": "Other", "hi": "अन्य", "en": "Other"}
            ]
        },
        {
            "category": "education_class",
            "options": [
                {"value": "Nursery", "hi": "नर्सरी", "en": "Nursery"},
                {"value": "LKG", "hi": "LKG", "en": "LKG"},
                {"value": "UKG", "hi": "UKG", "en": "UKG"},
                {"value": "Class 1", "hi": "कक्षा 1", "en": "Class 1"},
                {"value": "Class 2", "hi": "कक्षा 2", "en": "Class 2"},
                {"value": "Class 3", "hi": "कक्षा 3", "en": "Class 3"},
                {"value": "Class 4", "hi": "कक्षा 4", "en": "Class 4"},
                {"value": "Class 5", "hi": "कक्षा 5", "en": "Class 5"},
                {"value": "Class 6", "hi": "कक्षा 6", "en": "Class 6"},
                {"value": "Class 7", "hi": "कक्षा 7", "en": "Class 7"},
                {"value": "Class 8", "hi": "कक्षा 8", "en": "Class 8"},
                {"value": "Class 9", "hi": "कक्षा 9", "en": "Class 9"},
                {"value": "Class 10", "hi": "कक्षा 10", "en": "Class 10"},
                {"value": "Class 11", "hi": "कक्षा 11", "en": "Class 11"},
                {"value": "Class 12", "hi": "कक्षा 12", "en": "Class 12"},
                {"value": "Undergraduate", "hi": "स्नातक", "en": "Undergraduate"},
                {"value": "Postgraduate", "hi": "स्नातकोत्तर", "en": "Postgraduate"},
                {"value": "Doctorate", "hi": "पीएचडी", "en": "Doctorate"},
                {"value": "Other", "hi": "अन्य", "en": "Other"}
            ]
        }
    ]
    
    collection = db.get_collection("form_options")
    await collection.delete_many({}) # Clear old
    await collection.insert_many(options)
    print("Form options seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_form_options())
