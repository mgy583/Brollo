#!/bin/sh
TOKEN="$1"
curl -v -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试账户","account_type":"savings","currency":"CNY","initial_balance":1000}' \
  http://account-service:3001/accounts
