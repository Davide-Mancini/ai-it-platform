import time
import threading
from collections import defaultdict, deque

from fastapi import Depends, HTTPException

import models
from api.endpoints.auth import get_current_user


class RateLimiter:
    """
    Limite in-memory a finestra scorrevole, applicato per utente autenticato.

    NB: stato tenuto in RAM del processo. Va bene per un singolo worker/dev;
    con più worker o in produzione servirebbe uno store condiviso (es. Redis).
    """

    def __init__(self, max_calls: int, period_seconds: int):
        self.max_calls = max_calls
        self.period_seconds = period_seconds
        self._calls: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def __call__(self, current_user: models.User = Depends(get_current_user)) -> models.User:
        key = str(current_user.id)
        now = time.monotonic()
        cutoff = now - self.period_seconds

        with self._lock:
            timestamps = self._calls[key]
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            if len(timestamps) >= self.max_calls:
                retry_after = int(self.period_seconds - (now - timestamps[0])) + 1
                raise HTTPException(
                    status_code=429,
                    detail=f"Hai raggiunto il limite di {self.max_calls} richieste all'IA ogni {self.period_seconds}s. Riprova tra {retry_after} secondi.",
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(now)

        return current_user
