from flask import Flask, render_template, jsonify, request, send_file
import os
import json
from datetime import datetime

app = Flask(__name__)

# Store desktop items (in production, use a database)
DESKTOP_DATA_FILE = 'desktop_data.json'

def load_desktop_data():
    """Load desktop items from JSON file"""
    default_data = {
  "desktop_items": [
    {
      "id": "resume",
      "name": "Resume.pdf",
      "type": "file",
      "icon": "pdf",
      "action": "open_resume",
      "position": {
        "x": 19,
        "y": -22
      }
    },
    {
      "id": "github",
      "name": "GitHub",
      "type": "file",
      "icon": "github",
      "action": "open_link",
      "url": "https://github.com/Prashant-zHere",
      "position": {
        "x": 19,
        "y": 92
      }
    },
    {
      "id": "linkedin",
      "name": "LinkedIn",
      "type": "file",
      "icon": "linkedin",
      "action": "open_link",
      "url": "https://www.linkedin.com/in/prashant-s-99b61028a/",
      "position": {
        "x": 21,
        "y": 193
      }
    },
    {
      "id": "leetcode",
      "name": "LeetCode",
      "type": "file",
      "icon": "leetcode",
      "action": "open_link",
      "url": "https://leetcode.com/u/Prashant_here",
      "position": {
        "x": 118,
        "y": 194
      }
    },
    {
      "id": "email",
      "name": "Contact Me",
      "type": "file",
      "icon": "email",
      "action": "open_email",
      "email": "zedd.prashant@gmail.com",
      "position": {
        "x": 23,
        "y": 297
      }
    },
    {
      "id": "projects",
      "name": "My_Projects",
      "type": "folder",
      "icon": "folder",
      "action": "open_folder",
      "position": {
        "x": 21,
        "y": 415
      },
      "contents": [
        {
          "id": "project1",
          "name": "MedMinds.AI",
          "type": "project",
          "image": "/static/images/projects/project1.png",
          "description": "Breaking Medical Language Barriers with Artificial Intelligence. Turns medical jargons into simple laymen language",
          "url": "https://github.com/Prashant-zHere/MedMinds",
          "tech": [
            "Python",
            "Flask",
            "HTML5",
            "CSS",
            "Javascript",
            "RestAPIs"
          ]
        },
        {
          "id": "project2",
          "name": "Campus Voice",
          "type": "project",
          "image": "/static/images/projects/project2.jpg",
          "description": "CampusVoice is a complaint and suggestion management system for colleges. It Bridges the gap between students and college admins. Students can submit complaint and suggestion with files with keeping there identity secret.",
          "url": "https://github.com/Prashant-zHere/Campus_Voice",
          "tech": [
            "PHP",
            "MySQL",
            "HTML5",
            "CSS",
            "JS",
            "AJAX",
            "PHPMailer"
          ]
        },
        {
          "id": "project3",
          "name": "Memory Defragmentation (DSA-C)",
          "type": "project",
          "image": "/static/images/projects/project3.png",
          "description": "This project implements a fixed-size circular doubly linked list in C, supporting operations such as insertion, deletion, traversal, and defragmentation. It demonstrates dynamic memory allocation, pointer manipulation, and efficient data organization using a menu-driven approach.",
          "url": "https://github.com/Prashant-zHere/Memory_Defragmentation_DSA-C",
          "tech": [
            "C",
            "DSA"
          ]
        },
        {
          "id": "project4",
          "name": "HomeCare Connect",
          "type": "project",
          "image": "/static/images/projects/project4.png",
          "description": "Connecting Care. Empowering Homes | 🏠 HomeCare Connect connects homeowners with trusted service providers 🔧, offering easy booking 📅 and service management in one simple platform.",
          "url": "https://github.com/Prashant-zHere/HomeCare_Connect",
          "tech": [
            "PHP",
            "MySQL",
            "HTML5",
            "CSS",
            "JS"
          ]
        },
        {
          "id": "project5",
          "name": "VoteWise",
          "type": "project",
          "image": "/static/images/projects/project5.png",
          "description": "🗳️ Online Student Voting System. A web-based system for schools and colleges to conduct secure and easy online student elections 🚀🔐",
          "url": "https://github.com/Prashant-zHere/Memory_Defragmentation_DSA-C",
          "tech": [
            "PHP",
            "MySQL",
            "HTML5",
            "CSS",
            "JS",
            "Chart.js"
          ]
        }
      ]
    },
    {
      "id": "about",
      "name": "About Me.txt",
      "type": "file",
      "icon": "text",
      "action": "open_text",
      "content": "Hello! I'm a passionate Full-Stack Developer...",
      "position": {
        "x": 20,
        "y": 520
      }
    },
    {
      "id": "skills",
      "name": "Skills",
      "type": "folder",
      "icon": "folder",
      "action": "open_folder",
      "position": {
        "x": 117,
        "y": -28
      },
      "contents": [
        {
          "name": "C/C++",
          "level": 80
        },
        {
          "name": "DSA",
          "level": 85
        },
        {
          "name": "Python",
          "level": 90
        },
        {
          "name": "JavaScript",
          "level": 85
        },
        {
          "name": "PHP",
          "level": 80
        },
        {
          "name": "HTML5 / CSS",
          "level": 75
        },
        {
          "name": "MySQL",
          "level": 85
        },
        {
          "name": "Flask",
          "level": 80
        },
        {
          "name": "Git / Github",
          "level": 85
        },
        {
          "name": "Docker",
          "level": 70
        }
      ]
    },
    {
      "id": "terminal",
      "name": "Terminal",
      "type": "app",
      "icon": "terminal",
      "action": "open_terminal",
      "position": {
        "x": 114,
        "y": 93
      }
    }
  ],
  "theme": "windows",
  "wallpaper": "/static/images/wallpaper.jpg",
  "user_name": "Prashant Sharma",
  "user_title": "Software Developer"
}
    
    if os.path.exists(DESKTOP_DATA_FILE):
        try:
            with open(DESKTOP_DATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return default_data
    return default_data

def save_desktop_data(data):
    """Save desktop items to JSON file"""
    with open(DESKTOP_DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def index():
    """Main desktop view"""
    data = load_desktop_data()
    return render_template('index.html', data=data)

@app.route('/api/desktop-items')
def get_desktop_items():
    """Get all desktop items"""
    data = load_desktop_data()
    return jsonify(data)

@app.route('/api/add-item', methods=['POST'])
def add_item():
    """Add a new file or folder to desktop"""
    data = load_desktop_data()
    new_item = request.json
    
    # Generate unique ID
    new_item['id'] = f"item_{datetime.now().timestamp()}"
    
    # Set default position
    if 'position' not in new_item:
        new_item['position'] = {"x": 220, "y": 20}
    
    data['desktop_items'].append(new_item)  # Changed from 'items'
    save_desktop_data(data)
    
    return jsonify({"success": True, "item": new_item})

@app.route('/api/update-position', methods=['POST'])
def update_position():
    """Update item position on desktop"""
    data = load_desktop_data()
    item_id = request.json.get('id')
    position = request.json.get('position')
    
    for item in data['desktop_items']:  # Changed from 'items'
        if item['id'] == item_id:
            item['position'] = position
            break
    
    save_desktop_data(data)
    return jsonify({"success": True})

@app.route('/api/delete-item', methods=['POST'])
def delete_item():
    """Delete an item from desktop"""
    data = load_desktop_data()
    item_id = request.json.get('id')
    
    data['desktop_items'] = [item for item in data['desktop_items'] if item['id'] != item_id]  # Changed
    save_desktop_data(data)
    
    return jsonify({"success": True})

@app.route('/api/toggle-theme', methods=['POST'])
def toggle_theme():
    """Toggle between Windows and macOS theme"""
    data = load_desktop_data()
    data['theme'] = 'macos' if data['theme'] == 'windows' else 'windows'
    save_desktop_data(data)
    return jsonify({"theme": data['theme']})

@app.route('/resume')
def get_resume():
    """Serve the resume PDF"""
    resume_path = os.path.join(app.static_folder, 'Resume.pdf')
    if os.path.exists(resume_path):
        return send_file(resume_path)
    return "Resume not found", 404

@app.route('/api/time')
def get_time():
    """Get current time for taskbar"""
    now = datetime.now()
    return jsonify({
        "time": now.strftime("%I:%M %p"),
        "date": now.strftime("%m/%d/%Y")
    })

if __name__ == '__main__':
    app.run(host = '0.0.0.0', debug=True, port=5000)
