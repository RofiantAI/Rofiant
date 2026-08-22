"""Regression checks for defensive decoding of stored multimodal messages."""

from app.agent.runner import _decode_content


def test_decode_multimodal_content():
    valid = _decode_content(
        '{"kind":"multimodal","text":"hello","images":[{"media_type":"image/png","data":"AAAA"}]}'
    )
    assert valid[0]["type"] == "image"
    assert valid[1] == {"type": "text", "text": "hello"}

    malformed = '{"kind":"multimodal","images":[{"data":"AAAA"}]}'
    assert _decode_content(malformed) == malformed
    assert _decode_content('{"kind":"multimodal","images":{}}') == '{"kind":"multimodal","images":{}}'
