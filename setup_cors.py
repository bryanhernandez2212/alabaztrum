
import firebase_admin
from firebase_admin import credentials, storage
import json

# Initialize Firebase (assuming creds are already set or using ADC)
# If credentials.json exists, load it directly
try:
    cred = credentials.Certificate('credentials.json')
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'alabaztrum.appspot.com'
    })
    print("Firebase initialized with credentials.json")
except Exception as e:
    print(f"Could not load credentials.json: {e}")
    # Try default if available
    try:
        firebase_admin.initialize_app(options={
            'storageBucket': 'alabaztrum.appspot.com'
        })
        print("Firebase initialized with default credentials")
    except Exception as e2:
        print(f"Failed to initialize Firebase: {e2}")
        exit(1)

def set_cors_configuration(bucket_name):
    """Sets the CORS configuration on a bucket."""
    bucket = storage.bucket(bucket_name)
    
    cors_configuration = [
        {
            "origin": ["*"],
            "method": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
            "responseHeader": ["Authorization", "Content-Type", "Content-Length", "User-Agent", "x-goog-resumable"],
            "maxAgeSeconds": 3600
        }
    ]
    
    bucket.cors = cors_configuration
    bucket.patch()

    print(f"Set CORS policies for bucket {bucket.name}")
    print(f"Current CORS: {bucket.cors}")

if __name__ == "__main__":
    set_cors_configuration("alabaztrum.appspot.com")
