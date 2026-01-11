#!/usr/bin/env python3
"""
Real-time Frappe LMS Integration with Auto-Sync
Watches for changes to top_3_projects.json and automatically syncs to Frappe LMS
"""

import json
import time
from pathlib import Path
from datetime import datetime
from frappe_lms_integration import FrappeLMSIntegration
import hashlib

class AutoSyncMonitor:
    def __init__(self, json_file="../top_3_projects.json", check_interval=5):
        self.json_file = Path(__file__).parent / json_file
        self.check_interval = check_interval
        self.last_hash = None
        self.integration = FrappeLMSIntegration()
        
    def get_file_hash(self):
        """Get hash of the JSON file to detect changes"""
        try:
            if not self.json_file.exists():
                return None
            with open(self.json_file, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception as e:
            print(f"Error reading file: {e}")
            return None
    
    def watch_and_sync(self):
        """Watch for changes and auto-sync"""
        print("\n" + "=" * 80)
        print("🔄 AUTO-SYNC MONITOR STARTED")
        print("=" * 80)
        print(f"Watching: {self.json_file}")
        print(f"Check interval: {self.check_interval} seconds")
        print("Press Ctrl+C to stop\n")
        
        # Initial sync
        current_hash = self.get_file_hash()
        if current_hash:
            print("📊 Initial sync...")
            self.integration.sync_top_projects(str(self.json_file))
            self.last_hash = current_hash
        else:
            print("⏳ Waiting for top_3_projects.json to be created...")
            print("Run: python run_integrated_workflow.py\n")
        
        try:
            while True:
                time.sleep(self.check_interval)
                
                current_hash = self.get_file_hash()
                
                # File was created or updated
                if current_hash and current_hash != self.last_hash:
                    print(f"\n🔔 [{datetime.now().strftime('%H:%M:%S')}] Change detected!")
                    print("📊 Syncing to Frappe LMS...")
                    
                    if self.integration.sync_top_projects(str(self.json_file)):
                        self.last_hash = current_hash
                        print("✓ Sync complete\n")
                    else:
                        print("❌ Sync failed\n")
                
        except KeyboardInterrupt:
            print("\n\n🛑 Auto-sync monitor stopped")
            return

def main():
    """Main entry point"""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        # Run once and exit
        integration = FrappeLMSIntegration()
        success = integration.sync_top_projects()
        return 0 if success else 1
    else:
        # Watch mode
        monitor = AutoSyncMonitor()
        monitor.watch_and_sync()
        return 0

if __name__ == "__main__":
    exit(main())
