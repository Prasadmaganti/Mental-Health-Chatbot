class MemoryService:
    def __init__(self, max_messages: int = 20):
        # Maps session_id (str) -> list of message dicts: [{"role": "user"/"assistant", "content": "..."}]
        self.sessions = {}
        self.max_messages = max_messages

    def get_history(self, session_id: str) -> list:
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        return self.sessions[session_id]

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        
        self.sessions[session_id].append({"role": role, "content": content})
        
        # Enforce maximum history length by keeping the most recent messages.
        if len(self.sessions[session_id]) > self.max_messages:
            self.sessions[session_id] = self.sessions[session_id][-self.max_messages:]

    def clear_history(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id] = []

memory_manager = MemoryService()
