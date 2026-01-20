from backend.agent import fetch_policy_text
import trafilatura

url = "https://www.zomato.com/policies/terms-of-service"
print(f"Testing URL: {url}")

try:
    # Test 1: Current Logic
    print("--- Test 1: Current Logic (Jina + Trafilatura) ---")
    text = fetch_policy_text(url)
    print(f"Result Length: {len(text)}")
    print(f"Preview: {text[:200]}")
    
    # Test 2: Direct Trafilatura
    print("\n--- Test 2: Direct Trafilatura ---")
    downloaded = trafilatura.fetch_url(url)
    if downloaded:
        extracted = trafilatura.extract(downloaded)
        print(f"Direct Extract Length: {len(extracted) if extracted else 0}")
    else:
        print("Direct Fetch Failed")

except Exception as e:
    print(f"Error: {e}")
