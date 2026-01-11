#!/usr/bin/env python3
"""
Frappe LMS Integration
Syncs top 3 projects from agent workflow to Frappe LMS as courses
"""

import json
import requests
from datetime import datetime
from pathlib import Path
import time

class FrappeLMSIntegration:
    def __init__(self, base_url="http://localhost:8000", username="Administrator", password="admin"):
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.logged_in = False
        
    def login(self):
        """Login to Frappe LMS"""
        try:
            # Get CSRF token first
            response = self.session.get(f"{self.base_url}/")
            
            # Login
            login_data = {
                "cmd": "login",
                "usr": self.username,
                "pwd": self.password
            }
            
            response = self.session.post(
                f"{self.base_url}/api/method/login",
                data=login_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'Logged In':
                    self.logged_in = True
                    print(f"✓ Logged in to Frappe LMS as {self.username}")
                    return True
            
            print(f"❌ Login failed: {response.text}")
            return False
            
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def create_course(self, project):
        """Create a course in Frappe LMS from project data"""
        try:
            # Prepare course data with rank to make titles unique
            course_title = f"[Rank {project['rank']}] {project['name']}"
            
            # Calculate duration based on estimated hours
            duration_days = max(1, project['estimated_hours'] // 8)
            
            course_data = {
                "doctype": "LMS Course",
                "title": course_title,
                "short_introduction": f"Priority: {project['priority_score']} | Complexity: {project['complexity'].title()} | {project['estimated_hours']} hours",
                "description": self._generate_course_description(project),
                "published": 1,
                "upcoming": 0,
                "tags": self._generate_tags(project),
                "instructors": [{
                    "instructor": "Administrator"
                }]
            }
            
            # Create course
            response = self.session.post(
                f"{self.base_url}/api/resource/LMS Course",
                json=course_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in [200, 201]:
                course = response.json().get('data', {})
                print(f"  ✓ Created course: {course_title}")
                
                # Add course outline
                course_name = course.get('name')
                if course_name:
                    self._add_course_outline(course_name, project)
                
                return course
            else:
                print(f"  ❌ Failed to create course: {response.text}")
                return None
                
        except Exception as e:
            print(f"  ❌ Error creating course: {e}")
            return None
    
    def _generate_course_description(self, project):
        """Generate detailed course description"""
        description = f"""
<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2196F3; margin-top: 0;">🤖 AI Agent Priority Analysis</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">
        <div><strong>🎯 Priority Score:</strong> {project['priority_score']}/100</div>
        <div><strong>⚡ Complexity:</strong> {project['complexity'].title()}</div>
        <div><strong>📅 Due Date:</strong> {project['due_date']}</div>
        <div><strong>⏱️ Estimated Time:</strong> {project['estimated_hours']} hours</div>
        <div><strong>✅ Decision:</strong> {project['decision'].replace('_', ' ').title()}</div>
        <div><strong>🏆 Rank:</strong> #{project['rank']} of Top 3</div>
    </div>
</div>

<div style="margin: 20px 0;">
    <h3 style="color: #4CAF50;">📋 Why This Project?</h3>
    <p style="font-size: 16px; line-height: 1.6;">{project.get('rationale', 'This course is designed to help you complete this project efficiently.')}</p>
</div>

<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
    <h3 style="color: #856404; margin-top: 0;">🚀 Your First Step</h3>
    <p style="font-size: 16px; color: #856404;">{project.get('first_step', 'Begin by understanding the project requirements and setting up your environment.')}</p>
</div>

<hr style="margin: 30px 0;">
<p style="text-align: center; color: #666; font-size: 14px;">
    <em>✨ This course was automatically generated by the AI Agent Workflow System<br>
    powered by DeepSeek + LangGraph multi-agent orchestration</em>
</p>
"""
        return description
    
    def _generate_tags(self, project):
        """Generate tags for the course"""
        tags = [
            "ai-generated",
            f"priority-{int(project['priority_score'])}",
            project['complexity'],
            project['decision'].lower()
        ]
        return ",".join(tags)
    
    def _add_course_outline(self, course_name, project):
        """Add chapters/lessons to the course"""
        try:
            # Create a chapter
            chapter_data = {
                "doctype": "Course Chapter",
                "title": "Getting Started",
                "course": course_name,
                "idx": 1
            }
            
            response = self.session.post(
                f"{self.base_url}/api/resource/Course Chapter",
                json=chapter_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in [200, 201]:
                chapter = response.json().get('data', {})
                chapter_name = chapter.get('name')
                print(f"    ✓ Added chapter to course")
                
                # Add first lesson
                if chapter_name:
                    self._add_lesson(chapter_name, project)
                    
        except Exception as e:
            print(f"    ❌ Error adding course outline: {e}")
    
    def _add_lesson(self, chapter_name, project):
        """Add a lesson to a chapter"""
        try:
            lesson_data = {
                "doctype": "Course Lesson",
                "title": "Project Overview & First Steps",
                "chapter": chapter_name,
                "body": f"""
<h2>Welcome to {project['name']}</h2>

<h3>Project Overview</h3>
<p>This project has been prioritized by our AI agent system with a score of {project['priority_score']}/100.</p>

<h3>Your First Step</h3>
<p>{project.get('first_step', 'Start by reviewing the project requirements.')}</p>

<h3>Key Information</h3>
<ul>
<li>Complexity: {project['complexity'].title()}</li>
<li>Estimated Time: {project['estimated_hours']} hours</li>
<li>Due Date: {project['due_date']}</li>
</ul>

<h3>Next Steps</h3>
<ol>
<li>Review all project requirements carefully</li>
<li>Set up your development environment</li>
<li>Break down the project into smaller tasks</li>
<li>Start with the highest priority task</li>
</ol>
""",
                "idx": 1
            }
            
            response = self.session.post(
                f"{self.base_url}/api/resource/Course Lesson",
                json=lesson_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in [200, 201]:
                print(f"      ✓ Added lesson to chapter")
                
        except Exception as e:
            print(f"      ❌ Error adding lesson: {e}")
    
    def sync_top_projects(self, json_file="../top_3_projects.json"):
        """Read top_3_projects.json and create courses in Frappe LMS"""
        try:
            # Read the JSON file
            json_path = Path(__file__).parent / json_file
            
            if not json_path.exists():
                print(f"❌ File not found: {json_path}")
                print("Run: python run_integrated_workflow.py")
                return False
            
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            print(f"\n📊 Syncing {data['total_projects_analyzed']} projects to Frappe LMS")
            print(f"Timestamp: {data['timestamp']}")
            print(f"Model: {data['model']}")
            print("-" * 80)
            
            # Login
            if not self.login():
                return False
            
            # Create courses for each project
            created_courses = []
            for project in data['top_3_projects']:
                print(f"\n📚 Creating course for Rank {project['rank']}: {project['name']}")
                course = self.create_course(project)
                if course:
                    created_courses.append(course)
            
            print("\n" + "=" * 80)
            print(f"✓ Successfully created {len(created_courses)} courses in Frappe LMS")
            print(f"Visit: {self.base_url}/lms")
            print("=" * 80)
            
            return True
            
        except Exception as e:
            print(f"❌ Error syncing projects: {e}")
            import traceback
            traceback.print_exc()
            return False

def main():
    """Main entry point"""
    print("\n" + "=" * 80)
    print("FRAPPE LMS INTEGRATION - AI Agent to LMS Sync")
    print("=" * 80)
    
    # Create integration instance
    integration = FrappeLMSIntegration()
    
    # Sync projects
    success = integration.sync_top_projects()
    
    if success:
        print("\n✅ Integration complete!")
        print("Your AI-generated courses are now available in Frappe LMS")
    else:
        print("\n❌ Integration failed")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
