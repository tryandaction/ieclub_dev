#!/bin/bash
# Test auth API

echo "Testing auth routes..."

echo -e "\n1. Testing send-verification-code:"
curl -k https://www.ieclub.online/api/auth/send-verification-code \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"13800138000"}' \
  2>/dev/null | python3 -m json.tool

echo -e "\n2. Testing register:"
curl -k https://www.ieclub.online/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"13800138000","password":"test123","verificationCode":"123456"}' \
  2>/dev/null | python3 -m json.tool

echo -e "\n3. Testing login:"
curl -k https://www.ieclub.online/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"13800138000","password":"test123"}' \
  2>/dev/null | python3 -m json.tool

echo -e "\nDone!"

