#!/bin/bash

ENV_FILE=".env"
VALID=0

step() {
    echo "▶ $1"
    sleep 1
}

echo "========================================"
echo "  ODZA Backend Environment Setup"
echo "========================================"
echo

# Step 1
step "Checking current directory..."
echo "[FOLDER] Current directory: $(pwd)"
echo

# Step 2: Check if .env exists
if [ -f "$ENV_FILE" ]; then
    step "Checking existing .env file..."
    echo "[CHECK] Found .env file at: $(pwd)/$ENV_FILE"

    step "Validating Firebase API key..."

    if grep -q "^FIREBASE_API_KEY=AIza" "$ENV_FILE"; then
        VALID=1
        echo "[OK] Valid Firebase API key found!"

        API_KEY=$(grep "^FIREBASE_API_KEY=" "$ENV_FILE" | cut -d '=' -f2)
        echo "[INFO] Current API key starts with: ${API_KEY:0:20}..."
        echo
        echo "[DONE] Your .env is already configured correctly."
        echo "       No changes needed."
        exit 0
    else
        echo "[WARNING] .env exists but has NO valid Firebase API key"
        echo

        read -p "Delete this invalid .env file? (y/n): " choice
        if [[ "$choice" =~ ^[Yy]$ ]]; then
            step "Deleting invalid .env file..."
            rm "$ENV_FILE"
            echo "[OK] Deleted invalid .env file"
            echo
        fi
    fi
else
    step "Checking for existing .env..."
    echo "[OK] No existing .env found in $(pwd)"
    echo
fi

# Ask for API key
echo "[INPUT] Enter Firebase API Key:"
echo

while true; do
    read -p "API Key: " FIREBASE_API_KEY

    if [ -z "$FIREBASE_API_KEY" ]; then
        echo "[ERROR] API key cannot be empty!"
        echo
        continue
    fi

    step "Validating API key format..."

    if [[ "$FIREBASE_API_KEY" != AIza* ]]; then
        echo "[WARNING] API key doesn't look like a Firebase key (should start with AIza)"
        read -p "Continue anyway? (y/n): " choice
        [[ "$choice" =~ ^[Yy]$ ]] || continue
    fi

    break
done

echo
step "Creating .env file..."

cat > "$ENV_FILE" <<EOF
# PostgreSQL Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=postgres
DB_PORT=5432
DB_NAME=odza_users

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Configuration
SESSION_EXPIRY_HOURS=8

# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Configuration
FIREBASE_API_KEY=$FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN=flowpro-wms.firebaseapp.com
FIREBASE_PROJECT_ID=flowpro-wms
FIREBASE_STORAGE_BUCKET=flowpro-wms.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=499934598299
FIREBASE_APP_ID=1:499934598299:web:01b3505f38b7b601bc223e
EOF

echo "[OK] .env created at: $(pwd)/$ENV_FILE"

echo
step "Preparing next steps..."
echo "[NEXT] Next steps:"
echo "   1. Run: docker-compose down"
echo "   2. Run: docker-compose up --build"
echo

read -p "Press Enter to exit..."