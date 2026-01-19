import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os

# Ensure backend can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock openai and trafilatura if not installed
try:
    import openai
except ImportError:
    sys.modules["openai"] = MagicMock()
    sys.modules["openai"].AsyncOpenAI = MagicMock()

try:
    import trafilatura
except ImportError:
    sys.modules["trafilatura"] = MagicMock()

from backend.agent import analyze_policy, PolicyAnalysis, RiskFlag, UserRight

class TestPolicyAgent(unittest.IsolatedAsyncioTestCase):

    @patch("backend.agent.trafilatura.fetch_url")
    @patch("backend.agent.trafilatura.extract")
    @patch("backend.agent.client.beta.chat.completions.parse", new_callable=AsyncMock)
    async def test_analyze_policy_success(self, mock_parse, mock_extract, mock_fetch):
        # Setup Mocks
        mock_fetch.return_value = "<html>Content</html>"
        mock_extract.return_value = "This is a privacy policy."
        
        # Mock LLM Response
        mock_response = MagicMock()
        expected_result = PolicyAnalysis(
            transparency_score=85,
            summary="Good policy.",
            risk_flags=[RiskFlag(category="None", severity="Low", description="None")],
            user_rights=[UserRight(right="Access", details="Yes")],
            verdict="Safe"
        )
        mock_response.choices = [MagicMock(message=MagicMock(parsed=expected_result))]
        mock_parse.return_value = mock_response

        # Run Test
        result = await analyze_policy("http://example.com")
        
        # Verify
        self.assertEqual(result.transparency_score, 85)
        self.assertEqual(result.verdict, "Safe")
        mock_fetch.assert_called_with("http://example.com")
        mock_parse.assert_called_once()

    @patch("backend.agent.trafilatura.fetch_url")
    async def test_analyze_policy_fetch_fail(self, mock_fetch):
        mock_fetch.return_value = None # Simulate fail
        
        result = await analyze_policy("http://bad-url.com")
        
        self.assertEqual(result.transparency_score, 0)
        self.assertEqual(result.verdict, "Error")
        self.assertIn("Could not fetch", result.summary)

if __name__ == "__main__":
    unittest.main()
