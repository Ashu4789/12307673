# Stage 1

## Notification System REST API Design

### Core Actions Supported
1. Retrieve Notifications : Fetch a paginated list of notifications for the authenticated user.
2. Mark as Read : Mark a specific notification as read.
3. Mark All as Read : Mark all unread notifications for the user as read.
4. Delete Notification: Remove a specific notification.
5. Real-time Updates: Push new notifications to connected clients instantly.


### Authentication

Headers:
```json
{
  "Authorization": "Bearer <JWT-TOKEN>",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```


Data Models

Notification Object
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "string (e.g., 'SYSTEM', 'MESSAGE', 'ALERT')",
  "title": "string",
  "message": "string",
  "isRead": "boolean",
  "actionUrl": "string (optional)",
  "createdAt": "timestamp (ISO 8601)"
}
```

---

### REST API Endpoints

#### 1. Retrieve User Notifications
Fetch a list of notifications for the logged-in user, sorted by creation date (newest first).

* Method: `GET`
* Endpoint: `/api/v1/notifications`
* Query Parameters:
  * `page`: Page number (default: 1)
  * `limit`: Items per page (default: 20)
  * `unreadOnly`: Boolean to filter only unread notifications (default: false)

Response: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "987fcdeb-51a2-43d7-9012-345678901234",
      "type": "SYSTEM",
      "title": "Welcome",
      "message": "Welcome to our platform.",
      "isRead": false,
      "actionUrl": "/dashboard",
      "createdAt": "2026-05-14 09:57:37.126783Z"
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

#### 2. Mark Notification as Read
Update the status of a specific notification to 'read'.

* Method: `PATCH`
* Endpoint: `/api/v1/notifications/{notificationId}/read`

Request Body: None required.

Response: `200 OK`
```json
{
  "success": true,
  "message": "Notification marked as read successfully!",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "isRead": true,
    "readAt": "2026-05-14 09:57:37.126783Z"
  }
}
```

#### 3. Mark All Notifications as Read
Update all unread notifications for the logged-in user to 'read'.

* Method: `POST`
* Endpoint: `/api/v1/notifications/read-all`

Request Body: None required.

Response: `200 OK`
```json
{
  "success": true,
  "message": "All notifications marked as read!",
  "data": {
    "updatedCount": 5
  }
}
```

#### 4. Delete a Notification
Permanently remove a notification from the user's view.

* Method: `DELETE`
* Endpoint: `/api/v1/notifications/{notificationId}`

Response: `204 No Content`
*(No body returned on successful deletion)*

---

### Real-Time Notification Mechanism

Users receive notifications immediately without polling the server by creating a WebSocket (WS) connection upon user login. 

#### Connection Details
* Protocol: `wss://` (WebSocket Secure)
* Endpoint: `wss://api.yourdomain.com/v1/notifications/stream`
* Authentication: Pass the JWT token during the initial connection handshake (e.g., via query parameters, headers if supported, or an initial authentication message payload).

#### WebSocket Event Dictionary

1. Server to Client: `NOTIFICATION_NEW`
Pushed to the client when a new notification is generated.
```json
{
  "event": "NOTIFICATION_NEW",
  "payload": {
    "id": "abc12345-e89b-12d3-a456-426614174000",
    "type": "MESSAGE",
    "title": "New Message Received",
    "message": "You have a new message from John Doe.",
    "isRead": false,
    "actionUrl": "/messages/123",
    "createdAt": "2026-05-14 09:57:37.126783Z"
  }
}
```

2. Server to Client: `UNREAD_COUNT_UPDATE`
Pushed to update the badge counter on the UI.
```json
{
  "event": "UNREAD_COUNT_UPDATE",
  "payload": {
    "count": 6
  }
}
```

**3. Client to Server: `PING` / Server to Client: `PONG`**
Used for keeping the connection alive (Heartbeat mechanism).
```json
// Client
{ "event": "PING" }

// Server
{ "event": "PONG" }
```
