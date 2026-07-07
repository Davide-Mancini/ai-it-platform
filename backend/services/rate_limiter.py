from fastapi import Depends

import models
from api.endpoints.auth import get_current_user
from services.sliding_window_limiter import SlidingWindowLimiter


class RateLimiter(SlidingWindowLimiter):
    """Rate limit per utente autenticato (es. generazione procedure con l'IA)."""

    def __call__(self, current_user: models.User = Depends(get_current_user)) -> models.User:
        self.check(
            str(current_user.id),
            f"Hai raggiunto il limite di {self.max_calls} richieste all'IA ogni {self.period_seconds}s.",
        )
        return current_user
