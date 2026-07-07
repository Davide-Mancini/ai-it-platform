import time
import threading
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class SlidingWindowLimiter:
    """
    Limite in-memory a finestra scorrevole, riusabile da qualsiasi rate
    limiter chiave-specifico (per utente, per IP, ecc.).

    NB: stato tenuto in RAM del processo. Va bene per un singolo worker/dev;
    con più worker o in produzione servirebbe uno store condiviso (es. Redis).

    Vive in un modulo a sé (senza dipendere da api.endpoints.auth) perché
    IPRateLimiter deve poter essere importato da auth.py stesso: se stesse
    nello stesso file di RateLimiter (che importa get_current_user da
    api.endpoints.auth), si creerebbe un import circolare.
    """

    def __init__(self, max_calls: int, period_seconds: int):
        self.max_calls = max_calls
        self.period_seconds = period_seconds
        self._calls: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, error_detail: str) -> None:
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
                    detail=f"{error_detail} Riprova tra {retry_after} secondi.",
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(now)


class IPRateLimiter(SlidingWindowLimiter):
    """Rate limit per indirizzo IP, per rotte non ancora autenticate (es. login)."""

    def __call__(self, request: Request) -> None:
        key = request.client.host if request.client else "unknown"
        self.check(key, "Troppi tentativi di accesso da questo indirizzo.")
