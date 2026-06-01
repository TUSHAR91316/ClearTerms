import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os

# Ensure backend can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Ensure trafilatura mock if not installed
try:
    import trafilatura
except ImportError:
    sys.modules["trafilatura"] = MagicMock()

from backend.agent import analyze_policy, PolicyAnalysis, RiskFlag, UserRight

class TestPolicyAgent(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        # Set a mock HF_TOKEN so the agent doesn't abort with configuration error
        self.env_patcher = patch.dict(os.environ, {"HF_TOKEN": "mock-hf-token"})
        self.env_patcher.start()

    def tearDown(self):
        self.env_patcher.stop()

    @patch("backend.agent.fetch_policy_text", new_callable=AsyncMock)
    @patch("backend.agent.get_hf_client")
    async def test_analyze_policy_success(self, mock_get_client, mock_fetch_policy):
        # Setup Mocks
        mock_fetch_policy.return_value = "This is a privacy policy."
        
        # Mock client and its async chat_completion method
        mock_client = MagicMock()
        mock_chat_completion = AsyncMock()
        
        mock_completion = MagicMock()
        mock_completion.choices = [
            MagicMock(message=MagicMock(content='{"transparency_score": 85, "summary": "Good policy.", "risk_flags": [{"category": "None", "severity": "Low", "description": "None"}], "user_rights": [{"right": "Access", "details": "Yes"}], "verdict": "Safe"}'))
        ]
        mock_chat_completion.return_value = mock_completion
        mock_client.chat_completion = mock_chat_completion
        mock_get_client.return_value = mock_client

        # Run Test
        result = await analyze_policy("http://example.com")
        
        # Verify
        self.assertEqual(result.transparency_score, 85)
        self.assertEqual(result.verdict, "Safe")
        mock_fetch_policy.assert_called_with("http://example.com")
        mock_chat_completion.assert_called_once()

    @patch("backend.agent.fetch_policy_text", new_callable=AsyncMock)
    async def test_analyze_policy_fetch_fail(self, mock_fetch_policy):
        mock_fetch_policy.return_value = "" # Simulate fail
        
        result = await analyze_policy("http://bad-url.com")
        
        self.assertEqual(result.transparency_score, 0)
        self.assertEqual(result.verdict, "Error")
        self.assertIn("Could not fetch", result.summary)

if __name__ == "__main__":
    unittest.main()
