#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Testing Profile Functionality"
echo "==========================="

# Step 1: Create test user
echo -n "Creating test user... "
TEST_USER=$(curl -s -X POST http://localhost:3000/api/test-user -H "Content-Type: application/json")
if [[ $TEST_USER == *"error"* ]]; then
  echo -e "${RED}Failed${NC}"
  echo $TEST_USER
  exit 1
else
  echo -e "${GREEN}Success${NC}"
fi

# Use hardcoded test user details since we know them
TEST_EMAIL="test@example.com"
TEST_USERNAME="testuser"
TEST_PASSWORD="Test123!@#"

# Step 2: Try accessing profile directly
echo -n "Accessing profile directly... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/profile/$TEST_USERNAME")
if [[ $HTTP_CODE == "404" ]]; then
  echo -e "${RED}Failed${NC}"
  echo "Profile page returned 404 Not Found"
  exit 1
elif [[ $HTTP_CODE == "200" ]]; then
  echo -e "${GREEN}Success${NC}"
else
  echo -e "${RED}Failed${NC}"
  echo "Profile page returned unexpected status code: $HTTP_CODE"
  exit 1
fi

# Step 3: Get CSRF token
echo -n "Getting CSRF token... "
CSRF_RESPONSE=$(curl -s -c cookies.txt http://localhost:3000/api/auth/csrf)
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)

if [[ -z "$CSRF_TOKEN" ]]; then
  echo -e "${RED}Failed${NC}"
  echo "Could not get CSRF token"
  exit 1
else
  echo -e "${GREEN}Success${NC}"
fi

# Step 4: Sign in with test user
echo -n "Signing in with test user... "
SIGNIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"csrfToken\":\"$CSRF_TOKEN\",\"json\":true}")

if [[ $SIGNIN_RESPONSE == *"error"* ]]; then
  echo -e "${RED}Failed${NC}"
  echo $SIGNIN_RESPONSE
  exit 1
else
  echo -e "${GREEN}Success${NC}"
fi

# Step 5: Get session
echo -n "Getting session... "
SESSION_RESPONSE=$(curl -s -b cookies.txt -c cookies.txt http://localhost:3000/api/auth/session)
if [[ $SESSION_RESPONSE == *"email"* ]]; then
  echo -e "${GREEN}Success${NC}"
else
  echo -e "${RED}Failed${NC}"
  echo "Could not get session"
  exit 1
fi

# Step 6: Get user profile data
echo -n "Getting user profile data... "
PROFILE_DATA=$(curl -s -b cookies.txt http://localhost:3000/api/test-user)
if [[ $PROFILE_DATA == *"error"* ]]; then
  echo -e "${RED}Failed${NC}"
  echo $PROFILE_DATA
  exit 1
else
  echo -e "${GREEN}Success${NC}"
  echo "Profile data:"
  echo $PROFILE_DATA
fi

# Clean up
rm -f cookies.txt

echo -e "\n${GREEN}All tests completed successfully${NC}" 