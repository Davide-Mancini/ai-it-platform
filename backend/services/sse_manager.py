import asyncio
from typing import Dict, List


class SSEManager:
    def __init__(self):
        self._queues: Dict[str, List[asyncio.Queue]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    async def subscribe(self, user_id: str) -> asyncio.Queue:
        self._loop = asyncio.get_running_loop()
        q: asyncio.Queue = asyncio.Queue()
        self._queues.setdefault(user_id, []).append(q)
        return q

    def unsubscribe(self, user_id: str, q: asyncio.Queue) -> None:
        if user_id in self._queues:
            try:
                self._queues[user_id].remove(q)
            except ValueError:
                pass

    def notify(self, user_id: str, data: dict) -> None:
        """Thread-safe: can be called from sync service handlers."""
        if not self._loop:
            return
        for q in self._queues.get(user_id, []):
            self._loop.call_soon_threadsafe(q.put_nowait, data)


sse_manager = SSEManager()
