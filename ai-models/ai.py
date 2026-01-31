from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import requests
from googletrans import Translator
import base64
from PIL import Image
import io
import os
from datetime import datetime, timedelta
import json
from typing import List, Dict
import sqlite3
from sentence_transformers import SentenceTransformer
import numpy as np
import pickle
from bs4 import BeautifulSoup
import threading
import time
from dotenv import load_dotenv

# Add these imports at the top of your Flask app
import speech_recognition as sr
import tempfile
import os
from pydub import AudioSegment

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API with environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

if not WEATHER_API_KEY:
    raise ValueError("WEATHER_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Initialize translator and embedding model
translator = Translator()
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Comprehensive Agricultural Knowledge Base
AGRICULTURAL_KNOWLEDGE = {
    "crops": {
        "delhi": {
            "wheat": {
                "planting_time": "November-December",
                "harvesting_time": "April-May",
                "soil_requirements": "Well-drained loamy soil, pH 6.0-7.5",
                "fertilizer": "120 kg N, 60 kg P2O5, 40 kg K2O per hectare",
                "pesticides": "For aphids: Imidacloprid 17.8% SL @ 100ml/200L water",
                "irrigation": "4-6 irrigations required",
                "yield": "4-5 tons per hectare"
            },
            "rice": {
                "planting_time": "June-July",
                "harvesting_time": "October-November",
                "soil_requirements": "Clay loam soil, pH 6.0-7.0",
                "fertilizer": "150 kg N, 75 kg P2O5, 50 kg K2O per hectare",
                "pesticides": "For stem borer: Chlorantraniliprole 18.5% SC @ 150ml/ha",
                "irrigation": "Continuous flooding during growth",
                "yield": "5-6 tons per hectare"
            }
        },
        "punjab": {
            "wheat": {
                "planting_time": "November 1-20",
                "harvesting_time": "April 15-May 5",
                "soil_requirements": "Sandy loam to clay loam, pH 6.5-7.5",
                "fertilizer": "150 kg N, 75 kg P2O5, 37.5 kg K2O per hectare",
                "pesticides": "For yellow rust: Propiconazole 25% EC @ 500ml/ha",
                "irrigation": "5-7 irrigations based on variety",
                "yield": "5-6 tons per hectare"
            },
            "rice": {
                "planting_time": "May 15-June 15",
                "harvesting_time": "September 15-October 15",
                "soil_requirements": "Heavy clay soil preferred",
                "fertilizer": "125 kg N, 25 kg P2O5, 25 kg K2O per hectare",
                "pesticides": "For brown plant hopper: Thiamethoxam 25% WG @ 100g/ha",
                "irrigation": "Direct seeded rice needs careful water management",
                "yield": "6-7 tons per hectare"
            }
        },
        "uttar pradesh": {
            "wheat": {
                "planting_time": "November 15-December 15",
                "harvesting_time": "April-May",
                "soil_requirements": "Alluvial soil, well-drained, pH 6.0-7.5",
                "fertilizer": "120 kg N, 60 kg P2O5, 40 kg K2O per hectare",
                "pesticides": "For termites: Chlorpyrifos 20% EC @ 2.5L/ha soil application",
                "irrigation": "6 irrigations at critical stages",
                "yield": "4-5 tons per hectare"
            },
            "sugarcane": {
                "planting_time": "February-March, October-November",
                "harvesting_time": "December-March (next year)",
                "soil_requirements": "Deep, well-drained loamy soil, pH 6.5-7.5",
                "fertilizer": "150 kg N, 60 kg P2O5, 60 kg K2O per hectare",
                "pesticides": "For early shoot borer: Cartap hydrochloride 4% G @ 18.5 kg/ha",
                "irrigation": "12-15 irrigations throughout the year",
                "yield": "70-80 tons per hectare"
            }
        }
    },
    "soil_management": {
        "loamy": {
            "characteristics": "Good drainage, fertility, and water retention",
            "suitable_crops": "Wheat, rice, maize, vegetables",
            "fertilizer_strategy": "Balanced NPK application",
            "organic_matter": "Add 10-15 tons FYM/ha annually"
        },
        "clay": {
            "characteristics": "High water retention, poor drainage",
            "suitable_crops": "Rice, wheat (with proper drainage)",
            "fertilizer_strategy": "Split application of nitrogen",
            "organic_matter": "Add compost and green manure"
        },
        "sandy": {
            "characteristics": "Good drainage, low fertility",
            "suitable_crops": "Millets, groundnut, vegetables",
            "fertilizer_strategy": "Frequent small doses",
            "organic_matter": "Essential - 15-20 tons FYM/ha"
        }
    },
    "seasonal_guidance": {
        "current_season": {
            "september": {
                "activities": ["Harvesting kharif crops", "Land preparation for rabi", "Sowing of early rabi crops"],
                "crops_to_plant": ["Early wheat varieties", "Mustard", "Gram"],
                "precautions": ["Control post-harvest pests", "Store grains properly"]
            }
        }
    },
    "pest_disease_management": {
        "common_pests": {
            "aphids": {
                "crops_affected": ["Wheat", "Mustard", "Vegetables"],
                "symptoms": ["Yellowing of leaves", "Stunted growth", "Honeydew secretion"],
                "control": ["Imidacloprid 17.8% SL @ 100ml/200L", "Neem oil spray"],
                "prevention": ["Remove weeds", "Use yellow sticky traps"]
            },
            "stem_borer": {
                "crops_affected": ["Rice", "Maize"],
                "symptoms": ["Dead hearts", "Holes in stems", "Withering of leaves"],
                "control": ["Chlorantraniliprole 18.5% SC @ 150ml/ha", "Cartap hydrochloride"],
                "prevention": ["Use pheromone traps", "Avoid excessive nitrogen"]
            }
        }
    }
}

# Database setup
def init_db():
    conn = sqlite3.connect('krishi_knowledge.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            embedding BLOB,
            category TEXT,
            location TEXT,
            language TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS weather_cache (
            location TEXT PRIMARY KEY,
            data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Weather API integration
def get_weather_data(lat, lon):
    """Get weather data from OpenWeatherMap API"""
    try:
        url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
        response = requests.get(url, timeout=10)
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Weather API error: {e}")
        return None

# Location-based coordinates
LOCATION_COORDS = {
    "delhi": {"lat": 28.6139, "lon": 77.2090},
    "punjab": {"lat": 31.1471, "lon": 75.3412},
    "uttar pradesh": {"lat": 26.8467, "lon": 80.9462},
    "up": {"lat": 26.8467, "lon": 80.9462}
}

# Enhanced RAG System with Agricultural Knowledge
class RAGSystem:
    def __init__(self):
        self.knowledge_base = []
        self.load_knowledge_base()
        self.populate_agricultural_knowledge()
    
    def populate_agricultural_knowledge(self):
        """Populate knowledge base with comprehensive agricultural data"""
        for location, crops in AGRICULTURAL_KNOWLEDGE["crops"].items():
            for crop, details in crops.items():
                content = f"""
                Crop: {crop.title()} in {location.title()}
                Planting Time: {details['planting_time']}
                Harvesting Time: {details['harvesting_time']}
                Soil Requirements: {details['soil_requirements']}
                Fertilizer Recommendation: {details['fertilizer']}
                Pesticide Usage: {details['pesticides']}
                Irrigation: {details['irrigation']}
                Expected Yield: {details['yield']}
                """
                self.add_knowledge(content, "crop_guidance", location, "en")
        
        # Add soil management knowledge
        for soil_type, details in AGRICULTURAL_KNOWLEDGE["soil_management"].items():
            content = f"""
            Soil Type: {soil_type.title()}
            Characteristics: {details['characteristics']}
            Suitable Crops: {details['suitable_crops']}
            Fertilizer Strategy: {details['fertilizer_strategy']}
            Organic Matter Management: {details['organic_matter']}
            """
            self.add_knowledge(content, "soil_management", "general", "en")
    
    def load_knowledge_base(self):
        """Load existing knowledge base from database"""
        try:
            conn = sqlite3.connect('krishi_knowledge.db')
            cursor = conn.cursor()
            cursor.execute("SELECT content, embedding, category, location FROM knowledge_base")
            rows = cursor.fetchall()
            
            for row in rows:
                content, embedding_blob, category, location = row
                embedding = pickle.loads(embedding_blob) if embedding_blob else None
                self.knowledge_base.append({
                    "content": content,
                    "embedding": embedding,
                    "category": category,
                    "location": location
                })
            conn.close()
            print(f"Loaded {len(self.knowledge_base)} items from knowledge base")
        except sqlite3.OperationalError as e:
            print(f"Database error: {e}")
            print("Knowledge base will be empty initially")
        except Exception as e:
            print(f"Error loading knowledge base: {e}")
    
    def add_knowledge(self, content, category, location, language="en"):
        """Add new knowledge to the base"""
        try:
            embedding = embedding_model.encode(content)
            
            # Store in database
            conn = sqlite3.connect('krishi_knowledge.db')
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO knowledge_base (content, embedding, category, location, language)
                VALUES (?, ?, ?, ?, ?)
            """, (content, pickle.dumps(embedding), category, location, language))
            conn.commit()
            conn.close()
            
            # Add to memory
            self.knowledge_base.append({
                "content": content,
                "embedding": embedding,
                "category": category,
                "location": location
            })
        except Exception as e:
            print(f"Error adding knowledge: {e}")
    
    def search_relevant_content(self, query, location, top_k=5):
        """Search for relevant content using similarity"""
        if not self.knowledge_base:
            return []
        
        try:
            query_embedding = embedding_model.encode(query)
            similarities = []
            
            for idx, item in enumerate(self.knowledge_base):
                if item["embedding"] is not None:
                    # Boost location-specific content
                    location_boost = 0.3 if item["location"].lower() == location.lower() else 0
                    similarity = np.dot(query_embedding, item["embedding"]) + location_boost
                    similarities.append((similarity, idx))
            
            similarities.sort(reverse=True)
            return [self.knowledge_base[idx] for _, idx in similarities[:top_k]]
        except Exception as e:
            print(f"Error searching relevant content: {e}")
            return []

def get_season_specific_guidance(location):
    """Get current season specific agricultural guidance"""
    current_month = datetime.now().strftime("%B").lower()
    current_date = datetime.now()
    
    # Define seasons for Indian agriculture
    if current_date.month in [6, 7, 8, 9]:  # Monsoon/Kharif
        season = "kharif"
        guidance = "This is Kharif season. Focus on monsoon crops like rice, maize, cotton, sugarcane."
    elif current_date.month in [10, 11, 12, 1, 2, 3]:  # Winter/Rabi
        season = "rabi"
        guidance = "This is Rabi season. Ideal time for wheat, barley, mustard, gram, peas."
    else:  # Summer
        season = "summer"
        guidance = "Summer season. Focus on irrigation management and summer crops like fodder, vegetables."
    
    return f"Current Season: {season.title()}. {guidance}"

def detect_and_translate(text, target_lang="en"):
    """Detect language and translate if needed"""
    try:
        detected = translator.detect(text)
        if detected.lang != target_lang:
            translated = translator.translate(text, dest=target_lang)
            return translated.text, detected.lang
        return text, detected.lang
    except Exception as e:
        print(f"Translation error: {e}")
        return text, "en"

def translate_response(text, target_lang):
    """Translate response to target language"""
    if target_lang == "en":
        return text
    try:
        translated = translator.translate(text, dest=target_lang)
        return translated.text
    except Exception as e:
        print(f"Response translation error: {e}")
        return text

# Default questions in multiple languages
DEFAULT_QUESTIONS = {
    "en": [
        "What crops should I plant this season?",
        "How much fertilizer do I need for wheat?",
        "How to control pests in my crop?",
        "When is the right time to harvest?"
    ],
    "hi": [
        "इस सीजन में कौन सी फसल लगानी चाहिए?",
        "गेहूं के लिए कितना उर्वरक चाहिए?",
        "फसल में कीड़े कैसे नियंत्रित करें?",
        "फसल काटने का सही समय कब है?"
    ],
    "pa": [
        "ਇਸ ਸੀਜ਼ਨ ਵਿੱਚ ਕਿਹੜੀ ਫਸਲ ਲਗਾਉਣੀ ਚਾਹੀਦੀ ਹੈ?",
        "ਕਣਕ ਲਈ ਕਿੰਨੀ ਖਾਦ ਚਾਹੀਦੀ ਹੈ?",
        "ਫਸਲ ਵਿੱਚ ਕੀੜੇ ਕਿਵੇਂ ਕੰਟਰੋਲ ਕਰੀਏ?",
        "ਫਸਲ ਵੱਢਣ ਦਾ ਸਹੀ ਸਮਾਂ ਕਦੋਂ ਹੈ?"
    ]
}

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_query = data.get('query', '')
        location = data.get('location', 'delhi').lower()
        soil_type = data.get('soilType', 'loamy')
        user_lang = data.get('language', 'auto')
        
        if not user_query:
            return jsonify({"success": False, "error": "Query is required"})
        
        # Check API key
        if not GEMINI_API_KEY:
            return jsonify({
                "success": False, 
                "error": "Gemini API key not configured."
            })
        
        # Detect and translate query
        english_query, detected_lang = detect_and_translate(user_query, "en")
        if user_lang == 'auto':
            user_lang = detected_lang
        
        # Get weather data
        coords = LOCATION_COORDS.get(location, LOCATION_COORDS["delhi"])
        weather_data = get_weather_data(coords["lat"], coords["lon"])
        
        # Search relevant content from RAG
        relevant_content = rag_system.search_relevant_content(english_query, location, top_k=3)
        
        # Get season-specific guidance
        season_guidance = get_season_specific_guidance(location)
        
        # Prepare comprehensive context for Gemini
        context = f"""
        You are an expert agricultural advisor specializing in Indian farming practices. Provide specific, actionable advice based on the following information:

        LOCATION: {location.title()}, India
        SOIL TYPE: {soil_type.title()}
        USER QUERY: {english_query}
        
        CURRENT AGRICULTURAL CONTEXT:
        {season_guidance}
        
        RELEVANT AGRICULTURAL KNOWLEDGE:
        {chr(10).join([item['content'] for item in relevant_content])}
        
        CURRENT WEATHER CONTEXT:
        {f"Temperature: {weather_data['list'][0]['main']['temp']}°C, Condition: {weather_data['list'][0]['weather'][0]['description']}, Humidity: {weather_data['list'][0]['main']['humidity']}%" if weather_data else "Weather data unavailable"}
        
        INSTRUCTIONS FOR YOUR RESPONSE:
        1. Address the farmer's specific question directly
        2. Provide location-specific recommendations for {location.title()}
        3. Consider the {soil_type} soil type in your advice
        4. Include specific quantities for fertilizers/pesticides when relevant
        5. Mention timing based on current season (September 2025)
        6. Give practical, implementable steps
        7. Include cost-effective solutions
        8. Mention any weather-related precautions if applicable
        
        Please structure your response with:
        - Direct answer to the question
        - Specific recommendations with quantities
        - Timing advice
        - Best practices
        - Precautions/warnings if any
        
        Keep the response practical and farmer-friendly, avoiding overly technical language.
        """
        
        # Generate response using Gemini
        response = model.generate_content(context)
        ai_response = response.text
        
        # Translate response back to user's language
        final_response = translate_response(ai_response, user_lang)
        
        # Store the interaction for future learning
        rag_system.add_knowledge(
            content=f"Location: {location}, Soil: {soil_type}, Query: {english_query}, Response: {ai_response}",
            category="user_interaction",
            location=location,
            language=user_lang
        )
        
        return jsonify({
            "success": True,
            "response": final_response,
            "detected_language": detected_lang,
            "weather_summary": weather_data["list"][0]["weather"][0]["description"] if weather_data else None,
            "location_context": f"{location.title()}, {soil_type} soil"
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        error_message = str(e)
        if "API_KEY_INVALID" in error_message:
            error_message = "Invalid API key. Please check your Gemini API key configuration."
        elif "PERMISSION_DENIED" in error_message:
            error_message = "API access denied. Please verify your API key permissions."
        elif "QUOTA_EXCEEDED" in error_message:
            error_message = "API quota exceeded. Please check your usage limits."
        
        return jsonify({"success": False, "error": error_message})

@app.route('/api/image-query', methods=['POST'])
def image_query():
    try:
        data = request.json
        image_data = data.get('image')
        query = data.get('query', 'Analyze this agricultural image and provide farming advice')
        location = data.get('location', 'delhi')
        user_lang = data.get('language', 'en')
        soil_type = data.get('soilType', 'loamy')
        
        if not image_data:
            return jsonify({"success": False, "error": "Image is required"})
        
        if not GEMINI_API_KEY:
            return jsonify({"success": False, "error": "Gemini API key not configured."})
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Get season guidance
        season_guidance = get_season_specific_guidance(location)
        
        # Prepare comprehensive prompt for image analysis
        prompt = f"""
        You are an expert agricultural advisor analyzing this farming image. Provide detailed, actionable advice:

        CONTEXT:
        - Location: {location.title()}, India
        - Soil Type: {soil_type.title()}
        - {season_guidance}
        - User Query: {query}

        ANALYZE THE IMAGE FOR:
        1. Crop Identification (if visible)
        2. Growth Stage Assessment
        3. Plant Health Status
        4. Pest/Disease Signs
        5. Nutrient Deficiency Symptoms
        6. Soil Condition Assessment
        7. Irrigation Status

        PROVIDE SPECIFIC RECOMMENDATIONS:
        - Immediate actions needed
        - Fertilizer applications with quantities
        - Pest/disease control measures
        - Irrigation scheduling
        - Harvesting timeline (if applicable)
        - Best practices for {location.title()} region
        
        Give practical, implementable advice with specific quantities and timing.
        """
        
        # Generate response using Gemini Vision
        response = model.generate_content([prompt, image])
        ai_response = response.text
        
        # Translate if needed
        final_response = translate_response(ai_response, user_lang)
        
        return jsonify({
            "success": True,
            "response": final_response,
            "analysis_type": "image_analysis",
            "location_context": f"{location.title()}, {soil_type} soil"
        })
        
    except Exception as e:
        print(f"Image query error: {e}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/default-questions', methods=['GET'])
def get_default_questions():
    lang = request.args.get('lang', 'en')
    location = request.args.get('location', 'delhi')
    
    questions = DEFAULT_QUESTIONS.get(lang, DEFAULT_QUESTIONS['en'])
    
    return jsonify({
        "success": True,
        "questions": questions,
        "location": location
    })

@app.route('/api/weather', methods=['GET'])
def get_weather():
    location = request.args.get('location', 'delhi')
    coords = LOCATION_COORDS.get(location, LOCATION_COORDS["delhi"])
    weather_data = get_weather_data(coords["lat"], coords["lon"])
    
    if weather_data:
        return jsonify({"success": True, "weather": weather_data})
    else:
        return jsonify({"success": False, "error": "Weather data unavailable"})
    
    # Add this endpoint to your Flask app
@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    try:
        data = request.json
        audio_data = data.get('audio')
        language = data.get('language', 'en')
        
        if not audio_data:
            return jsonify({"success": False, "error": "Audio data is required"})
        
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_data.split(',')[1])
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.m4a', delete=False) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name
        
        temp_wav_path = temp_audio_path.replace('.m4a', '.wav')
        
        try:
            # Convert M4A to WAV using pydub
            audio = AudioSegment.from_file(temp_audio_path, format="m4a")
            audio.export(temp_wav_path, format="wav")
            
            # Initialize speech recognizer
            recognizer = sr.Recognizer()
            
            # Load audio file
            with sr.AudioFile(temp_wav_path) as source:
                # Adjust for ambient noise
                recognizer.adjust_for_ambient_noise(source)
                # Record the audio
                audio_data = recognizer.record(source)
            
            # Map language codes for speech recognition
            language_map = {
                'en': 'en-US',
                'hi': 'hi-IN', 
                'pa': 'pa-IN'
            }
            
            speech_language = language_map.get(language, 'en-US')
            
            # Perform speech recognition
            try:
                # Try Google Speech Recognition first
                text = recognizer.recognize_google(audio_data, language=speech_language)
                
                if not text.strip():
                    raise sr.UnknownValueError("Empty recognition result")
                
                return jsonify({
                    "success": True,
                    "text": text,
                    "language": language,
                    "confidence": "high"  # Google API doesn't provide confidence scores
                })
                
            except sr.UnknownValueError:
                # If Google fails, try with different settings
                try:
                    # Try with longer timeout and different phrase time limit
                    text = recognizer.recognize_google(
                        audio_data, 
                        language=speech_language,
                        show_all=False
                    )
                    
                    if text.strip():
                        return jsonify({
                            "success": True,
                            "text": text,
                            "language": language,
                            "confidence": "medium"
                        })
                    else:
                        raise sr.UnknownValueError("No speech detected")
                        
                except sr.UnknownValueError:
                    return jsonify({
                        "success": False,
                        "error": "Could not understand the audio. Please speak clearly and try again.",
                        "error_type": "recognition_failed"
                    })
                    
            except sr.RequestError as e:
                print(f"Speech Recognition API error: {e}")
                return jsonify({
                    "success": False,
                    "error": "Speech recognition service is currently unavailable. Please try again later.",
                    "error_type": "service_unavailable"
                })
                
        finally:
            # Clean up temporary files
            try:
                if os.path.exists(temp_audio_path):
                    os.unlink(temp_audio_path)
                if os.path.exists(temp_wav_path):
                    os.unlink(temp_wav_path)
            except OSError as e:
                print(f"Error cleaning up temp files: {e}")
                
    except Exception as e:
        print(f"Speech-to-text error: {e}")
        return jsonify({
            "success": False,
            "error": f"Speech processing failed: {str(e)}",
            "error_type": "processing_error"
        })



@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "gemini_api": bool(GEMINI_API_KEY),
        "weather_api": bool(WEATHER_API_KEY),
        "knowledge_base_items": len(rag_system.knowledge_base) if 'rag_system' in globals() else 0,
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Check for required environment variables
    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY environment variable is required!")
        exit(1)
    
    if not WEATHER_API_KEY:
        print("❌ WEATHER_API_KEY environment variable is required!")
        exit(1)
    
    print("✅ API keys configured successfully")
    
    # Initialize database
    print("Initializing database...")
    init_db()
    

    
    # Initialize RAG system with agricultural knowledge
    print("Initializing enhanced RAG system with agricultural knowledge...")
    rag_system = RAGSystem()
    
    print(f"✅ Knowledge base populated with {len(rag_system.knowledge_base)} agricultural guidance items")
    print("🌾 Krishi AI Backend ready with comprehensive farming knowledge!")
    app.run(host='0.0.0.0', port=5000, debug=True)

