from types import SimpleNamespace

from app.main import _rate_limit_key
from app.rate_limit import RateLimiter


def test_sliding_window_limit_and_client_cap():
    limiter = RateLimiter(limit=2, window_seconds=10, max_clients=2)

    assert limiter.retry_after("alice", now=0) is None
    assert limiter.retry_after("alice", now=1) is None
    assert limiter.retry_after("alice", now=2) == 8
    assert limiter.retry_after("alice", now=10) is None

    assert limiter.retry_after("bob", now=10) is None
    assert limiter.retry_after("carol", now=10) is None
    assert len(limiter._requests) == 2


def test_authenticated_rate_limit_key_does_not_share_proxy_or_store_token():
    token = "Bearer secret"
    alice = SimpleNamespace(headers={"authorization": token}, client=SimpleNamespace(host="proxy"))
    bob = SimpleNamespace(headers={"authorization": "Bearer other"}, client=SimpleNamespace(host="proxy"))

    assert _rate_limit_key(alice) != _rate_limit_key(bob)
    assert token not in _rate_limit_key(alice)
