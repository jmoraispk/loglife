"""Queue module for managing application-wide queues.

This module provides queue objects for inter-thread/process communication.
"""

import queue

# Queue for streaming log messages to clients via SSE
log_queue = queue.Queue()

