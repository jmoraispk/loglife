# Postman Testing Documentation

## Front-end Emulator - Used Postman as a front-end emulator to send requests and receive responses

This document describes how to test the life-bot backend API using Postman as a front-end emulator.

## Steps for Postman

### 1. Start Server

Run the Flask app:
```bash
python app.py
```

The server will listen on:
```
http://localhost:5000
```

### 2. Request Details

**Method:** POST  
**URL:** `http://localhost:5000/process`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw, JSON):**
```json
{
  "message": "bot: 31232",
  "from": "test_user"
}
```

### 3. Example Requests

#### Goal Rating Submission
```json
{
  "message": "bot: 31232",
  "from": "user123"
}
```

#### View Goals
```json
{
  "message": "bot: goals",
  "from": "user123"
}
```

#### Week Summary
```json
{
  "message": "bot: week",
  "from": "user123"
}
```

#### Lookback Summary
```json
{
  "message": "bot: lookback 7",
  "from": "user123"
}
```

### 4. Validation

Check response body in Postman for:
- Success responses with formatted data
- Error messages for invalid inputs
- Proper JSON formatting

### 5. Expected Response Examples

#### Successful Goal Rating
```
📅 Mon (Sep 30)
1 2 3 4 5
🟢 🟡 🟢 🟢 🟡
```

#### Goals List
```
```
1 Exercise
2 Diet
3 Sleep
4 Work
5 Social
```
```

#### Week Summary
```
```
Week 39: Sep 30 - Oct 06
    1 2 3 4 5
```
Last 7 days:
Mon 🟢 🟡 🟢 🟢 🟡
Tue ⚪ ⚪ ⚪ ⚪ ⚪
Wed ⚪ ⚪ ⚪ ⚪ ⚪
Thu ⚪ ⚪ ⚪ ⚪ ⚪
Fri ⚪ ⚪ ⚪ ⚪ ⚪
Sat ⚪ ⚪ ⚪ ⚪ ⚪
Sun ⚪ ⚪ ⚪ ⚪ ⚪
```
```

### 6. Error Handling

#### Invalid Input Length
```json
{
  "message": "bot: 123",
  "from": "user123"
}
```
**Response:** `❌ Invalid input. Send 5 digits like: 31232`

#### Invalid Input Range
```json
{
  "message": "bot: 45678",
  "from": "user123"
}
```
**Response:** `❌ Invalid input. Send 5 digits between 1 and 3`

#### Unrecognized Message
```json
{
  "message": "hello world",
  "from": "user123"
}
```
**Response:** `❌ Unrecognized message. Use 'bot: 31232' or 'bot: show week'`

## Notes

- The `from` field acts as the user identifier for data storage
- Goal ratings must be digits 1-3 (1=red, 2=yellow, 3=green)
- All messages must start with "bot:" to be processed
- The system tracks daily goal ratings and provides weekly summaries