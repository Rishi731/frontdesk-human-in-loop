# Human-in-the-Loop AI Supervisor

This project simulates an AI receptionist that interacts with users via video call and escalates unanswered questions to a supervisor for response. The system uses Flask as the backend, Firebase for question storage and supervisor handling, and LiveKit for video call functionality.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Setting Up the Project](#setting-up-the-project)
- [Running the Project](#running-the-project)
- [Alternative LiveKit Installation](#alternative-livekit-installation)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)

## Prerequisites
- Python 3.x
- pip
- Firebase project credentials
- LiveKit account and credentials
- dotenv file for environment variables

## Setting Up the Project

### 1. Create a Virtual Environment
To start working on this project, create a virtual environment to isolate your dependencies.

-- python3 -m venv venv

### 2. Activate the Virtual Environment

#### On Windows:

-- venv\Scripts\activate

#### On macOS/Linux:

-- source venv/bin/activate

### 3. Install the Required Dependencies

Run the following command to install all required libraries:

-- pip install -r requirements.txt

### 4. Firebase Setup
Make sure you have Firebase set up with Firestore enabled. Download the `firebase-adminsdk` credentials file from the Firebase console and store it in your project directory Backend folder.

Then, create a `.env` file in the Backend folder of your project with the following content:

```env
FIREBASE_CREDENTIALS_PATH=path/to/your/firebase/credentials.json
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

## Running the Project

1. **Start the Flask Backend**
   
   Once you've set up your environment and installed the required libraries, you can run the Flask server using the following command, for that first go to the backend folder - (cd Backend):

--   python app.py

2. **Access the Application**
   
   Run index.html with live server(Right click on the index.html - Open with live server)

   - Video Call starts with the "Start Video Call" button.
   - You can ask questions via the "Ask a question" feature.
   - Questions not in the knowledge base will be escalated to the supervisor.

3. **Supervisor Panel**
   
   Supervisors can answer questions through the `/supervisor/requests` interface, which will update the status of pending requests. For this open supervisor.html with live server(Right click on the supervisor.html - Open with live server)

## Alternative LiveKit Installation

If installing `livekit` via `pip install livekit` doesn't work, try using this command instead:

-- pip install livekit-python

Then, modify the import in your code:

-- from livekit_python import AccessToken, VideoGrant


## Project Structure

```
Backend
- app.py
- .env
- human-in-the-loop-ai_____.json

Frontend
- index.html
- app.js
- supervisor.html
```

## Technologies Used
- **Flask**: A lightweight Python web framework.
- **Firebase**: For storing questions, answers, and managing help requests.
- **LiveKit**: For real-time video call capabilities.
- **Python Dotenv**: For loading environment variables from a `.env` file.

---
