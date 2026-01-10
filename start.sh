#!/bin/bash

echo "🚀 Project Manager Agent - Startup Script"
echo "=========================================="
echo ""

# Check if MongoDB is running
echo "📊 Checking MongoDB..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" --quiet 2>/dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Starting MongoDB..."
        brew services start mongodb-community 2>/dev/null || \
        systemctl start mongod 2>/dev/null || \
        echo "Please start MongoDB manually"
    fi
elif command -v mongo &> /dev/null; then
    if mongo --eval "db.version()" --quiet 2>/dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Starting MongoDB..."
        brew services start mongodb-community 2>/dev/null || \
        systemctl start mongod 2>/dev/null || \
        echo "Please start MongoDB manually"
    fi
else
    echo "⚠️  MongoDB client not found. Using connection string from .env.local"
fi

echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from example..."
    cp .env.local.example .env.local 2>/dev/null || \
    echo "MONGODB_URI=mongodb://localhost:27017/project-manager" > .env.local
    echo "✅ Created .env.local"
else
    echo "✅ .env.local exists"
fi

echo ""

# Ask if user wants to seed database
read -p "🌱 Seed database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running seed script..."
    npm run seed
    echo ""
fi

# Start development server
echo "🎯 Starting Next.js development server..."
echo "📱 Open http://localhost:3000 in your browser"
echo ""
npm run dev
