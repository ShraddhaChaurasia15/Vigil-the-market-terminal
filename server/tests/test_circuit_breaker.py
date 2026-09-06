import pytest
from app.engine.data_provider import CircuitBreaker

def test_circuit_breaker_flow():
    cb = CircuitBreaker(failure_threshold=3, recovery_timeout=0.5)
    assert cb.state == "CLOSED"
    assert cb.is_available() is True

    # 1st failure
    cb.record_failure()
    assert cb.state == "CLOSED"
    assert cb.is_available() is True

    # 2nd failure
    cb.record_failure()
    assert cb.state == "CLOSED"
    assert cb.is_available() is True

    # 3rd failure -> trips OPEN
    cb.record_failure()
    assert cb.state == "OPEN"
    assert cb.is_available() is False

    # Success resets to CLOSED
    cb.record_success()
    assert cb.state == "CLOSED"
    assert cb.failure_count == 0
