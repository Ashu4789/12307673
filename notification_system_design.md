# Stage 1

Notification System REST API Design

Core Actions Supported
1. Retrieve Notifications : Fetch a paginated list of notifications for the authenticated user.
2. Mark as Read : Mark a specific notification as read.
3. Mark All as Read : Mark all unread notifications for the user as read.
4. Delete Notification: Remove a specific notification.
5. Real-time Updates: Push new notifications to connected clients instantly.


Authentication

Headers:

{
  "Authorization": "Bearer <JWT-TOKEN>",
  "Content-Type": "application/json",
  "Accept": "application/json"
}


Data Models

Notification Object
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

---

REST API Endpoints

1. Retrieve User Notifications
Fetch a list of notifications for the logged-in user, sorted by creation date (newest first).

* Method: GET
* Endpoint: /api/v1/notifications
* Query Parameters:
  * page: Page number (default: 1)
  * limit: Items per page (default: 20)
  * unreadOnly: Boolean to filter only unread notifications (default: false)

Response: 200 OK
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

2. Mark Notification as Read
Update the status of a specific notification to 'read'.

* Method: PATCH
* Endpoint: /api/v1/notifications/{notificationId}/read

Request Body: None required.

Response: 200 OK
{
  "success": true,
  "message": "Notification marked as read successfully!",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "isRead": true,
    "readAt": "2026-05-14 09:57:37.126783Z"
  }
}


3. Mark All Notifications as Read
Update all unread notifications for the logged-in user to 'read'.

* Method: POST
* Endpoint: /api/v1/notifications/read-all

Request Body: None required.

Response: 200 OK
{
  "success": true,
  "message": "All notifications marked as read!",
  "data": {
    "updatedCount": 5
  }
}


4. Delete a Notification
Permanently remove a notification from the user's view.

* Method: DELETE
* Endpoint: /api/v1/notifications/{notificationId}

Response: 204 No Content
*(No body returned on deletion)*

---

Real-Time Notification Mechanism

Users receive notifications immediately without polling the server by creating a WebSocket (WS) connection upon user login. 

Connection Details
* Protocol: wss:// (WebSocket Secure)
* Endpoint: wss://api.yourdomain.com/v1/notifications/stream
* Authentication: Pass the JWT token during the initial connection handshake (e.g., via query parameters, headers if supported, or an initial authentication message payload).

WebSocket Event Dictionary

1. Server to Client: `NOTIFICATION_NEW`
Pushed to the client when a new notification is generated.
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


2. Serve to Client: UNREAD_COUNT_UPDATE
Pushed to update the badge counter on the UI.
{
  "event": "UNREAD_COUNT_UPDATE",
  "payload": {
    "count": 6
  }
}

3. Client to Server: PING / Server to Client: PONG
Used for keeping the connection alive (Heartbeat mechanism).
{
  // Client
 { "event": "PING" }

// Server
{ "event": "PONG" }
}

------------------------------------------------------------------------

# Stage 2

Database Selection

I would suggest using PostgreSQL database.

Why PostgreSQL?
It is highly organized digital filing container. Since our notifications have a very clear structure (e.g we always know they need an ID, a user, a message, and a read status), a relational database is perfect. It ensures our data stays neat, strictly enforces rules (like making sure every notification is from a real user), and handles searches well. 

While a NoSQL database (like MongoDB) could also work if we expected the structure of notifications to change dynamically, sticking to PostgreSQL keeps things predictable, secure, and easy to manage for notification platforms.

---

Database Schema

Table Name: notifications

Column Name: id
Data Type:UUID (Primary Key) 
Description: A unique identity for every notification

Column Name: user_id
Data Type:UUID (Indexed)
Description: The ID of the user receiving the notification.

Column Name: type
Data Type:VARCHAR(50)
Description: The category (e.g., 'SYSTEM', 'MESSAGE').

Column Name: title
Data Type:VARCHAR(255)
Description: Title of the notification.

Column Name: message
Data Type:TEXT
Description: The actual message.

Column Name: is_read
Data Type:BOOLEAN
Description: True if the user has seen it, False otherwise (Default: false).

Column Name: action_url
Data Type:VARCHAR(255)
Description: A link to take the user to when they click it (Optional).

Column Name: created_at
Data Type:TIMESTAMP
Description: The exact date and time it was created (Default: NOW()).

---

Handling Data Volume (Scaling)

As our application will grow, the number of notifications will increase day by day. Here are the problems we might face and their solutions:

1. Slow Searches
Problem: Searching large datasets for unread notifications is slow.
Solution: Use Indexing on user_id and created_at columns.

2. Running Out of Space
Problem: Storing old notifications wastes storage.
Solution: Implement Data Pruning to delete notifications older than 30 days.

3. Too Many Unread Count Checks
Problem: Frequent DB checks for unread counts stress the system.
Solution: Use Caching (e.g., Redis) for fast unread count lookups.

---

SQL Queries

Based on the REST APIs designed in Stage 1 and our PostgreSQL schema, here are the actual queries the server would run:

1. Retrieve User Notifications
SELECT id, type, title, message, is_read, action_url, created_at FROM notifications WHERE user_id = "user_id" ORDER BY created_at DESC LIMIT "page_number"  OFFSET "limit";

2. Mark Notification as Read
UPDATE notifications SET is_read = true WHERE id = "notification_id" AND user_id = "user_id";

3. Mark All Notifications as Read
UPDATE notifications SET is_read = true WHERE user_id = "user_id" AND is_read = false;

4. Delete a Notification
DELETE FROM notifications WHERE id = "notification_id" AND user_id = "user_id";

# Stage 3

The query is logically accurate but it is not optimized. SELECT * is bad practice, and ASC shows oldest notifications first instead of newest.

-> Without indexes on studentID and isRead, the database performs a full table scan on 5,000,000 rows.

->Change: Add a composite index on (studentID, isRead, createdAt) and select only required columns.
->Cost: Time complexity reduces to O(log N), drastically improves speed.
-> Indexing every column -> It wastes storage space and severely slows down write operations (INSERT, UPDATE, DELETE).

Placement Notification Query
SELECT DISTINCT studentID FROM notifications WHERE notificationType = 'Placement' AND createdAt >= NOW() - INTERVAL '7 days';

# Stage 4

Solution:
Use an In-Memory Cache (e.g., Redis) and transition from client fetching on page load to Server-Push (WebSockets).

Performance Improvement
Data will be read from the fast Redis cache instead of the SQL database. WebSockets maintain a single open connection to push updates instantly, eliminating redundancy in database queries during page navigation.

Tradeoffs
1. Caching:
   - Pros: Drastically reduces DB load and latency.
   - Cons: Adds infrastructure complexity and requires cache invalidation to prevent stale data.
2. WebSockets:
   - Pros: Eliminates repetitive HTTP requests and provides real-time updates.
   - Cons: Persistent connections consume server memory and make scaling/load balancing hectic.

---

# Stage 5

Shortcomings Observed:
1. Looping one by one over 50,000 students is slow.
2. Error in send_email halts the loop, and the remaining students remain unnotified and in inconsistent state.
3. Database writes, email dispatch, and push notifications are tied together in the same thread.

Dealing with the 200 Failed Emails:
Currently, it's a mess to recover because we don't know exactly where it failed without manual checks. The rest of the students missed their notifications entirely.

Redesign for Reliability & Speed:
We should shift to an event-driven, asynchronous architecture using a Message Queue. The notify_all function should just drop events into the queue and return instantly. Independent services can then process these events concurrently, to ensure high speed and reliability.
We can use Dead Letter Queues for automatic retries if an email fails.

Should DB Save and Email Happen Together?
No, Database inserts are very fast, while sending emails via external APIs is slow and prone to latency. Running them synchronously means the fast database is blocked and in waiting state for the slow email to finish sending. They should be handled independently by asynchronous background services.

New Pseudocode:


#Main API Handler
function notify_all(student_ids: array, message: string):
    # Quickly publish events to a message broker and return response
    for student_id in student_ids:
        publish_to_queue("notification_events", { student_id, message })
    
    return "Notifications are being processed."

#Database Writer (Consumes from Queue)
function database_writer(event):
    save_to_db(event.student_id, event.message)

#Email Sender (Consumes from Queue)
function email_Sender(event):
    try:
        send_email(event.student_id, event.message)
    except EmailFailureError:
        send_to_dead_letter_queue(event) # Automatically retries later

#Push Notification Sender (Consumes from Queue)
function push_notification_Sender(event):
    push_to_app(event.student_id, event.message)

