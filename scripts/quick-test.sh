#!/bin/bash

echo "🧪 Quick Security Test for YouTube-to-Notes"
echo "=========================================="

BASE_URL="http://localhost:3003"

# Test 1: Security Headers
echo "1. Testing Security Headers..."
headers=$(curl -I -s $BASE_URL)
echo "Headers check:"
echo "$headers" | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy)"

# Test 2: Rate Limiting
echo -e "\n2. Testing Rate Limiting..."
echo "Sending 5 test requests..."
for i in {1..5}; do
    response=$(curl -s -w "%{http_code}" -X POST $BASE_URL/api/videos/process \
        -H "Content-Type: application/json" \
        -d '{"videoUrl":"test"}' -o /dev/null)
    echo "Request $i: Status $response"
done

# Test 3: Authentication Protection
echo -e "\n3. Testing Authentication Protection..."
auth_response=$(curl -s -w "%{http_code}" -X POST $BASE_URL/api/notes/save \
    -H "Content-Type: application/json" \
    -d '{"title":"test","content":"test"}' -o /dev/null)
echo "Protected endpoint response: $auth_response"

# Test 4: Input Validation
echo -e "\n4. Testing Input Validation..."
validation_response=$(curl -s -w "%{http_code}" -X POST $BASE_URL/api/videos/process \
    -H "Content-Type: application/json" \
    -d '{"videoUrl":"https://evil.com/script.js"}' -o /dev/null)
echo "Invalid URL response: $validation_response"

echo -e "\n✅ Quick tests completed!"
echo "Check the results above. All tests should show proper security responses."
