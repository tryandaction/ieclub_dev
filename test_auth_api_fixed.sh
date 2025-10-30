#!/bin/bash
# Test auth API with correct route names

echo "Testing auth routes..."

echo -e "\n1. Testing /api/test:"
curl -k https://www.ieclub.online/api/test 2>/dev/null | python3 -m json.tool

echo -e "\n2. Testing send-verify-code (correct name):"
curl -k https://www.ieclub.online/api/auth/send-verify-code \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"13800138000"}' \
  2>/dev/null | python3 -m json.tool

echo -e "\n3. Testing register:"
curl -k https://www.ieclub.online/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"13800138000","password":"test123","verificationCode":"123456","nickname":"测试用户"}' \
  2>/dev/null | python3 -m json.tool

echo -e "\n4. Testing login:"
curl -k https://www.ieclub.online/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"13800138000","password":"test123"}' \
  2>/dev/null | python3 -m json.tool

echo -e "\nDone!"

