#!/usr/bin/env python3
"""
Script de test avancé pour l'API Arcane avec Python
Usage: python test-api.py [--env local|staging|prod] [--suite basic|full|stress]
"""

import requests
import json
import time
import argparse
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import random

class APITester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.token = None
        self.refresh_token = None
        self.session = requests.Session()
        self.results = {"passed": 0, "failed": 0, "errors": []}

    def set_auth_header(self):
        """Set authorization header if token exists"""
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})

    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp and color"""
        colors = {
            "INFO": "\033[0m",
            "SUCCESS": "\033[92m",
            "WARNING": "\033[93m",
            "ERROR": "\033[91m"
        }
        reset = "\033[0m"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"{colors.get(level, '')}{timestamp} [{level}] {message}{reset}")

    def test(self, name: str):
        """Decorator for test functions"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                self.log(f"Testing: {name}")
                try:
                    result = func(*args, **kwargs)
                    if result:
                        self.log(f"✓ {name} passed", "SUCCESS")
                        self.results["passed"] += 1
                    else:
                        self.log(f"✗ {name} failed", "ERROR")
                        self.results["failed"] += 1
                        self.results["errors"].append(name)
                    return result
                except Exception as e:
                    self.log(f"✗ {name} error: {str(e)}", "ERROR")
                    self.results["failed"] += 1
                    self.results["errors"].append(f"{name}: {str(e)}")
                    return False
            return wrapper
        return decorator

    # Authentication Tests
    def test_signup(self, email: str = None) -> bool:
        """Test user signup"""
        if not email:
            email = f"test_{int(time.time())}@example.com"

        data = {
            "email": email,
            "password": "TestPass123!",
            "firstName": "Test",
            "lastName": "User",
            "role": "SCOUT"
        }

        resp = self.session.post(f"{self.base_url}/auth/signup", json=data)
        return resp.status_code in [200, 201]

    def test_login(self, email: str = "scout1@arcane.com",
                   password: str = None) -> bool:
        """Test user login"""
        if password is None:
            password = os.environ.get("ARCANE_DEMO_PASSWORD", "<DEMO_PASSWORD>")
        data = {"email": email, "password": password}
        resp = self.session.post(f"{self.base_url}/auth/login", json=data)

        if resp.status_code == 200:
            response_data = resp.json()
            self.token = response_data.get("token") or response_data.get("access_token")
            self.refresh_token = response_data.get("refreshToken") or response_data.get("refresh_token")
            self.set_auth_header()
            return True
        return False

    def test_get_profile(self) -> bool:
        """Test getting user profile"""
        resp = self.session.get(f"{self.base_url}/auth/me")
        return resp.status_code == 200

    def test_refresh_token(self) -> bool:
        """Test token refresh"""
        if not self.refresh_token:
            return False

        data = {"refreshToken": self.refresh_token}
        resp = self.session.post(f"{self.base_url}/auth/refresh", json=data)

        if resp.status_code == 200:
            response_data = resp.json()
            self.token = response_data.get("token") or response_data.get("access_token")
            self.set_auth_header()
            return True
        return False

    # CRUD Tests
    def test_list_players(self) -> Dict[str, Any]:
        """Test listing players"""
        resp = self.session.get(f"{self.base_url}/players?limit=5")
        if resp.status_code == 200:
            return resp.json()
        return {}

    def test_create_player(self) -> Optional[str]:
        """Test creating a player"""
        data = {
            "firstName": "Test",
            "lastName": f"Player_{int(time.time())}",
            "birthDate": "2000-01-01",
            "nationality": "French",
            "position": "MIDFIELDER",
            "height": 180,
            "weight": 75,
            "preferredFoot": "RIGHT"
        }

        resp = self.session.post(f"{self.base_url}/players", json=data)
        if resp.status_code in [200, 201]:
            return resp.json().get("id")
        return None

    def test_update_player(self, player_id: str) -> bool:
        """Test updating a player"""
        data = {"height": 182, "weight": 76}
        resp = self.session.put(f"{self.base_url}/players/{player_id}", json=data)
        return resp.status_code == 200

    def test_delete_player(self, player_id: str) -> bool:
        """Test deleting a player"""
        resp = self.session.delete(f"{self.base_url}/players/{player_id}")
        return resp.status_code in [200, 204]

    # Performance Tests
    def test_response_time(self, endpoint: str, method: str = "GET",
                          data: Dict = None) -> float:
        """Test response time for an endpoint"""
        start = time.time()

        if method == "GET":
            self.session.get(f"{self.base_url}{endpoint}")
        elif method == "POST":
            self.session.post(f"{self.base_url}{endpoint}", json=data)

        return time.time() - start

    def test_concurrent_requests(self, endpoint: str, num_requests: int = 10) -> Dict:
        """Test concurrent requests"""
        results = {"success": 0, "failed": 0, "times": []}

        def make_request():
            start = time.time()
            try:
                resp = self.session.get(f"{self.base_url}{endpoint}")
                duration = time.time() - start
                return {"success": resp.status_code == 200, "time": duration}
            except:
                return {"success": False, "time": time.time() - start}

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]

            for future in as_completed(futures):
                result = future.result()
                if result["success"]:
                    results["success"] += 1
                else:
                    results["failed"] += 1
                results["times"].append(result["time"])

        results["avg_time"] = sum(results["times"]) / len(results["times"])
        results["max_time"] = max(results["times"])
        results["min_time"] = min(results["times"])

        return results

    def test_rate_limiting(self) -> bool:
        """Test rate limiting"""
        # Make rapid login attempts
        blocked = False
        for i in range(10):
            resp = self.session.post(
                f"{self.base_url}/auth/login",
                json={"email": "test@test.com", "password": "wrong"}
            )
            if resp.status_code == 429:
                blocked = True
                self.log(f"Rate limited after {i+1} requests", "SUCCESS")
                break
            time.sleep(0.1)

        return blocked

    # AI Feature Tests
    def test_ai_features(self, player_id: str = None) -> bool:
        """Test AI endpoints"""
        if not player_id:
            # Get a player ID
            players = self.test_list_players()
            if players and isinstance(players, dict):
                data = players.get("data", players.get("players", []))
                if data and len(data) > 0:
                    player_id = data[0].get("id")

        if not player_id:
            self.log("No player ID available for AI tests", "WARNING")
            return False

        # Test AI index
        resp = self.session.get(f"{self.base_url}/ai/index/{player_id}")

        # May return 403 if subscription tier is insufficient
        return resp.status_code in [200, 403]

    # Search and Analytics Tests
    def test_search(self, query: str = "test") -> bool:
        """Test search functionality"""
        resp = self.session.get(f"{self.base_url}/search?query={query}&limit=5")
        return resp.status_code == 200

    def test_analytics(self) -> bool:
        """Test analytics endpoints"""
        endpoints = [
            "/analytics/overview",
            "/analytics/players",
            "/analytics/activity-trends?days=7"
        ]

        for endpoint in endpoints:
            resp = self.session.get(f"{self.base_url}{endpoint}")
            if resp.status_code != 200:
                self.log(f"Analytics endpoint {endpoint} failed", "WARNING")
                return False

        return True

    # Stress Test
    def stress_test(self, duration: int = 30, rps: int = 10):
        """Run stress test for specified duration"""
        self.log(f"Starting stress test: {duration}s @ {rps} req/s", "INFO")

        endpoints = [
            "/health",
            "/players?limit=10",
            "/clubs?limit=10",
            "/matches/upcoming?limit=5"
        ]

        start_time = time.time()
        total_requests = 0
        successful_requests = 0
        failed_requests = 0
        response_times = []

        while time.time() - start_time < duration:
            endpoint = random.choice(endpoints)

            req_start = time.time()
            try:
                resp = self.session.get(f"{self.base_url}{endpoint}")
                req_time = time.time() - req_start
                response_times.append(req_time)

                if resp.status_code == 200:
                    successful_requests += 1
                else:
                    failed_requests += 1
            except Exception as e:
                failed_requests += 1
                self.log(f"Request failed: {e}", "WARNING")

            total_requests += 1

            # Control request rate
            time.sleep(1 / rps)

        # Calculate statistics
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        success_rate = (successful_requests / total_requests * 100) if total_requests else 0

        self.log(f"""
Stress Test Results:
- Total Requests: {total_requests}
- Successful: {successful_requests}
- Failed: {failed_requests}
- Success Rate: {success_rate:.2f}%
- Avg Response Time: {avg_response_time:.3f}s
- Max Response Time: {max(response_times) if response_times else 0:.3f}s
- Min Response Time: {min(response_times) if response_times else 0:.3f}s
        """, "INFO")

        return success_rate >= 95

    # Test Suites
    def run_basic_suite(self):
        """Run basic test suite"""
        self.log("Running Basic Test Suite", "INFO")

        tests = [
            ("Health Check", lambda: self.session.get(f"{self.base_url}/health").status_code == 200),
            ("Login", lambda: self.test_login()),
            ("Get Profile", lambda: self.test_get_profile()),
            ("List Players", lambda: bool(self.test_list_players())),
            ("Search", lambda: self.test_search()),
        ]

        for name, test_func in tests:
            self.test(name)(test_func)()

    def run_full_suite(self):
        """Run full test suite"""
        self.log("Running Full Test Suite", "INFO")

        # Authentication
        self.test("Signup")(self.test_signup)()
        self.test("Login")(self.test_login)()
        self.test("Get Profile")(self.test_get_profile)()
        self.test("Refresh Token")(self.test_refresh_token)()

        # CRUD Operations
        player_id = self.test("Create Player")(self.test_create_player)()
        if player_id:
            self.test("Update Player")(lambda: self.test_update_player(player_id))()
            self.test("Delete Player")(lambda: self.test_delete_player(player_id))()

        # Search and Analytics
        self.test("Search")(self.test_search)()
        self.test("Analytics")(self.test_analytics)()

        # AI Features
        self.test("AI Features")(self.test_ai_features)()

        # Performance
        self.test("Rate Limiting")(self.test_rate_limiting)()

        # Response time tests
        endpoints = ["/health", "/players", "/clubs"]
        for endpoint in endpoints:
            time_taken = self.test_response_time(endpoint)
            if time_taken < 1.0:
                self.log(f"Response time {endpoint}: {time_taken:.3f}s", "SUCCESS")
            else:
                self.log(f"Response time {endpoint}: {time_taken:.3f}s (slow)", "WARNING")

    def run_stress_suite(self):
        """Run stress test suite"""
        self.log("Running Stress Test Suite", "INFO")

        # Login first
        self.test_login()

        # Run stress test
        self.test("Stress Test")(lambda: self.stress_test(duration=30, rps=10))()

        # Test concurrent requests
        result = self.test_concurrent_requests("/players", num_requests=50)
        self.log(f"Concurrent test: {result['success']}/50 successful, avg: {result['avg_time']:.3f}s", "INFO")

    def print_summary(self):
        """Print test summary"""
        total = self.results["passed"] + self.results["failed"]
        success_rate = (self.results["passed"] / total * 100) if total else 0

        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        print(f"✓ Passed: {self.results['passed']}")
        print(f"✗ Failed: {self.results['failed']}")
        print(f"Success Rate: {success_rate:.1f}%")

        if self.results["errors"]:
            print("\nFailed Tests:")
            for error in self.results["errors"]:
                print(f"  - {error}")

        print("="*50)

        return self.results["failed"] == 0


def main():
    parser = argparse.ArgumentParser(description="API Testing Tool")
    parser.add_argument("--env", choices=["local", "staging", "prod"],
                      default="local", help="Environment to test")
    parser.add_argument("--suite", choices=["basic", "full", "stress"],
                      default="basic", help="Test suite to run")
    parser.add_argument("--verbose", action="store_true",
                      help="Enable verbose output")

    args = parser.parse_args()

    # Set base URL based on environment
    base_urls = {
        "local": "http://localhost:5000",
        "staging": "https://staging-api.arcane.com",
        "prod": "https://api.arcane.com"
    }

    tester = APITester(base_urls[args.env])

    print(f"API Testing Tool")
    print(f"Environment: {args.env}")
    print(f"Base URL: {base_urls[args.env]}")
    print(f"Test Suite: {args.suite}")
    print("-"*50)

    # Run selected suite
    if args.suite == "basic":
        tester.run_basic_suite()
    elif args.suite == "full":
        tester.run_full_suite()
    elif args.suite == "stress":
        tester.run_stress_suite()

    # Print summary and exit
    success = tester.print_summary()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
