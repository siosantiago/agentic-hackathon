#!/usr/bin/env python3
"""
Test Frappe LMS Integration
Quick test to verify LMS is accessible and can create courses
"""

import requests
import json
from frappe_lms_integration import FrappeLMSIntegration

def test_lms_connection():
    """Test basic connectivity to Frappe LMS"""
    print("\n🧪 Testing Frappe LMS Connection...")
    print("-" * 60)
    
    try:
        response = requests.get("http://localhost:8000/lms", timeout=5)
        if response.status_code == 200:
            print("✓ Frappe LMS is accessible at http://localhost:8000/lms")
            return True
        else:
            print(f"❌ LMS returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Frappe LMS")
        print("   Make sure Docker is running: docker compose up -d")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login():
    """Test login functionality"""
    print("\n🔐 Testing Login...")
    print("-" * 60)
    
    integration = FrappeLMSIntegration()
    if integration.login():
        print("✓ Login successful")
        return True
    else:
        print("❌ Login failed")
        return False

def test_create_sample_course():
    """Test creating a sample course"""
    print("\n📚 Testing Course Creation...")
    print("-" * 60)
    
    integration = FrappeLMSIntegration()
    if not integration.login():
        return False
    
    # Create a test course
    sample_project = {
        "rank": 0,
        "name": "Test Course - AI Agent Integration",
        "priority_score": 99,
        "complexity": "medium",
        "due_date": "2026-02-01",
        "estimated_hours": 10,
        "decision": "TEST",
        "rationale": "This is a test course created by the integration test script.",
        "first_step": "Verify that this course appears in Frappe LMS"
    }
    
    course = integration.create_course(sample_project)
    if course:
        print("✓ Test course created successfully")
        print(f"  Course ID: {course.get('name')}")
        print(f"  Visit: http://localhost:8000/lms")
        return True
    else:
        print("❌ Failed to create test course")
        return False

def test_json_file():
    """Test if top_3_projects.json exists and is valid"""
    print("\n📄 Testing top_3_projects.json...")
    print("-" * 60)
    
    try:
        with open("../top_3_projects.json", 'r') as f:
            data = json.load(f)
        
        print(f"✓ JSON file found and valid")
        print(f"  Timestamp: {data.get('timestamp')}")
        print(f"  Projects: {data.get('total_projects_analyzed')}")
        print(f"  Top 3: {len(data.get('top_3_projects', []))}")
        
        return True
    except FileNotFoundError:
        print("❌ top_3_projects.json not found")
        print("   Run: python run_integrated_workflow.py")
        return False
    except json.JSONDecodeError:
        print("❌ Invalid JSON file")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("FRAPPE LMS INTEGRATION TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("LMS Connection", test_lms_connection),
        ("Login", test_login),
        ("JSON File", test_json_file),
        ("Course Creation", test_create_sample_course),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "❌ FAIL"
        print(f"{status:8} {test_name}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    
    print("\n" + "-" * 60)
    print(f"Results: {passed_count}/{total_count} tests passed")
    print("=" * 60)
    
    return 0 if passed_count == total_count else 1

if __name__ == "__main__":
    exit(main())
