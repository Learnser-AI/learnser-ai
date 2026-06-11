import os
import re
import tempfile
import asyncio
import sys
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import edge_tts

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

VOICE_ALEX = "en-US-GuyNeural"  
VOICE_SAM = "en-US-AvaNeural"    

def sanitize_text(text):
    """Strips out web urls and bracketed data but preserves structural em-dashes and ellipses."""
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'\[.*?\]|\(.*?\)', '', text)
    text = text.replace('*', '').replace('#', '').strip()
    return text

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if path and os.path.exists(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

@app.route('/stream-line', methods=['POST'])
def stream_line():
    try:
        data = request.json or {}
        speaker = data.get('speaker', 'HOST A')
        raw_text = data.get('text', '')
        index = data.get('index', 0)
        
        text = sanitize_text(raw_text)
        if not text or len(text.strip()) < 2:
            text = "..."

        temp_dir = tempfile.gettempdir()
        filename = os.path.join(temp_dir, f"edupod_stream_{index}.mp3")
        
        if os.path.exists(filename):
            return send_file(filename, mimetype="audio/mp3")

        if "HOST A" in speaker.upper():
            voice = VOICE_ALEX
            pitch = "-2Hz"    
            rate = "-2%"     
        else:
            voice = VOICE_SAM
            pitch = "+2Hz"    
            rate = "+4%"     

        async def generate_audio():
            communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
            await communicate.save(filename)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(generate_audio())
        finally:
            loop.close()
        
        return send_file(filename, mimetype="audio/mp3")

    except Exception as e:
        print(f"💥 Audio processing failure on line {index}: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/purge-cache', methods=['POST'])
def purge_cache():
    temp_dir = tempfile.gettempdir()
    for f in os.listdir(temp_dir):
        if f.startswith('edupod_stream_') and f.endswith('.mp3'):
            try: 
                os.remove(os.path.join(temp_dir, f))
            except: 
                pass
    return jsonify({"status": "cleared"})

if __name__ == '__main__':
    print("🚀 Starting EduPod Backend Server explicitly on http://127.0.0.1:8080...")
    app.run(host='127.0.0.1', port=8080, debug=False)
