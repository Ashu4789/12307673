// Priorities: Placement > Result > Event
const WEIGHTS = {
    'Placement': 3,
    'Result': 2,
    'Event': 1
};

class MinHeap {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.heap = [];
    }

    // Compare A and B. Returns positive if A is higher priority than B.
    static compare(a, b) {
        const weightA = WEIGHTS[a.Type] || 0;
        const weightB = WEIGHTS[b.Type] || 0;

        if (weightA !== weightB) {
            return weightA - weightB;
        }

        // If weights are equal, tie-breaker is recency (newer is better)
        const timeA = new Date(a.Timestamp).getTime();
        const timeB = new Date(b.Timestamp).getTime();
        return timeA - timeB;
    }

    get leftChild() { return (i) => 2 * i + 1; }
    get rightChild() { return (i) => 2 * i + 2; }
    get parent() { return (i) => Math.floor((i - 1) / 2); }

    push(item) {
        if (this.heap.length < this.maxSize) {
            this.heap.push(item);
            this.heapifyUp(this.heap.length - 1);
        } else if (MinHeap.compare(item, this.heap[0]) > 0) {
            // New item has higher priority than the lowest priority item in the heap
            this.heap[0] = item;
            this.heapifyDown(0);
        }
    }

    heapifyUp(i) {
        while (i > 0) {
            let p = this.parent(i);
            // If current node is smaller (lower priority) than parent, swap them
            if (MinHeap.compare(this.heap[i], this.heap[p]) < 0) {
                [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
                i = p;
            } else {
                break;
            }
        }
    }

    
    heapifyDown(i) {
        let n = this.heap.length;
        while (true) {
            let left = this.leftChild(i);
            let right = this.rightChild(i);
            let smallest = i;

            if (left < n && MinHeap.compare(this.heap[left], this.heap[smallest]) < 0) {
                smallest = left;
            }
            if (right < n && MinHeap.compare(this.heap[right], this.heap[smallest]) < 0) {
                smallest = right;
            }

            if (smallest !== i) {
                [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
                i = smallest;
            } else {
                break;
            }
        }
    }

    // Return the sorted elements (highest priority first)
    getSorted() {
        return [...this.heap].sort((a, b) => MinHeap.compare(b, a));
    }
}

async function fetchNotifications() {
    try {
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhc2h1dG9zaG1vaGFudHkyMDA0QGdtYWlsLmNvbSIsImV4cCI6MTc3ODc2NTI5NywiaWF0IjoxNzc4NzY0Mzk3LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNWQ2NWMyY2YtZGUzMy00YmNhLTk5MjktMDNlNGM2NjUyMWYzIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiYXNodXRvc2ggbW9oYW50eSIsInN1YiI6ImExYWI2NmE2LWFmODctNGI4NC04MjliLTI5MTNjZTgyYmQ3ZCJ9LCJlbWFpbCI6ImFzaHV0b3NobW9oYW50eTIwMDRAZ21haWwuY29tIiwibmFtZSI6ImFzaHV0b3NoIG1vaGFudHkiLCJyb2xsTm8iOiIxMjMwNzY3MyIsImFjY2Vzc0NvZGUiOiJUUnZaV3EiLCJjbGllbnRJRCI6ImExYWI2NmE2LWFmODctNGI4NC04MjliLTI5MTNjZTgyYmQ3ZCIsImNsaWVudFNlY3JldCI6ImVyUU1VVW1YVnFoY0dTcE0ifQ.KEXgLMMXwWDqmZrb5kY0qxqa1W4CUDlEaZ9Z2aTSlUU";
        const response = await fetch('http://4.224.186.213/evaluation-service/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.notifications || data;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

async function displayPriorityInbox() {
    const notifications = await fetchNotifications();
    const TOP_N = 10;
    
    // We maintain a min-heap of size 10 to efficiently keep the top 10 notifications
    // even if a stream of millions of notifications comes in.
    const inboxQueue = new MinHeap(TOP_N);

    // Process incoming stream
    for (const notif of notifications) {
        inboxQueue.push(notif);
    }

    const priorityInbox = inboxQueue.getSorted();

    console.log(`\n=== PRIORITY INBOX (Top ${TOP_N}) ===\n`);
    priorityInbox.forEach((notif, index) => {
        console.log(`${index + 1}. [${notif.Type}] ${notif.Message} | ${notif.Timestamp}`);
    });
    console.log(`\n=================================\n`);
}

displayPriorityInbox();
