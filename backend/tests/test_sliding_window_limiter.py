"""
Altro esempio di test unitario puro, ma stavolta con qualcosa da "arrangiare":
il tempo. SlidingWindowLimiter usa time.monotonic() internamente, quindi per
testare in modo affidabile cosa succede dopo N secondi usiamo monkeypatch per
sostituire time.monotonic con un orologio finto che controlliamo noi, invece
di mettere degli sleep() veri nei test (che li renderebbero lenti e fragili).
"""
import pytest
from fastapi import HTTPException

from services.sliding_window_limiter import SlidingWindowLimiter


class FakeClock:
    def __init__(self, start=0.0):
        self.now = start

    def __call__(self):
        return self.now

    def advance(self, seconds):
        self.now += seconds


@pytest.fixture()
def fake_clock(monkeypatch):
    clock = FakeClock()
    monkeypatch.setattr("services.sliding_window_limiter.time.monotonic", clock)
    return clock


def test_allows_calls_up_to_the_limit(fake_clock):
    limiter = SlidingWindowLimiter(max_calls=3, period_seconds=60)

    for _ in range(3):
        limiter.check(key="1.2.3.4", error_detail="Troppi tentativi.")
    # Nessuna eccezione sollevata: siamo entro il limite.


def test_blocks_the_call_that_exceeds_the_limit(fake_clock):
    limiter = SlidingWindowLimiter(max_calls=3, period_seconds=60)
    for _ in range(3):
        limiter.check(key="1.2.3.4", error_detail="Troppi tentativi.")

    with pytest.raises(HTTPException) as exc_info:
        limiter.check(key="1.2.3.4", error_detail="Troppi tentativi.")

    assert exc_info.value.status_code == 429
    assert "Retry-After" in exc_info.value.headers


def test_limit_is_independent_per_key(fake_clock):
    """Un IP che sfora il limite non deve bloccare un IP diverso."""
    limiter = SlidingWindowLimiter(max_calls=1, period_seconds=60)

    limiter.check(key="1.1.1.1", error_detail="Troppi tentativi.")

    limiter.check(key="2.2.2.2", error_detail="Troppi tentativi.")  # non deve sollevare


def test_old_calls_slide_out_of_the_window_and_free_up_capacity(fake_clock):
    limiter = SlidingWindowLimiter(max_calls=1, period_seconds=60)
    limiter.check(key="1.2.3.4", error_detail="Troppi tentativi.")

    with pytest.raises(HTTPException):
        limiter.check(key="1.2.3.4", error_detail="Troppi tentativi.")

    fake_clock.advance(61)  # la prima chiamata è ora fuori dalla finestra di 60s

    limiter.check(key="1.2.3.4", error_detail="Troppi tentativi.")  # non deve sollevare
