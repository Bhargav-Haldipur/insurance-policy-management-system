"""
Insurance Policy MCP Server
----------------------------
Exposes your Spring Boot REST API as MCP tools that Claude (or any MCP client)
can call. Each @mcp.tool() function maps to one REST endpoint.

Transport: stdio (Claude talks to this process via stdin/stdout)
"""

import httpx
from mcp.server.fastmcp import FastMCP

# --- Server setup ---------------------------------------------------------
# FastMCP is the high-level server class from the official MCP Python SDK.
# The name here ("Insurance Policy API") is what MCP clients see when they
# list available servers.
mcp = FastMCP("Insurance Policy API")

# Base URL of your running Spring Boot backend.
# Change this to http://localhost:8080 when running locally (outside Docker).
BASE_URL = "http://localhost:8080/api"


# --- Helper ---------------------------------------------------------------
# A thin wrapper around httpx so every tool shares the same error handling.
# MCP tools communicate results back as plain strings — Claude reads them and
# decides what to do next.

def _request(method: str, path: str, **kwargs) -> str:
    """Make an HTTP request to the backend and return a readable string result."""
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.request(method, f"{BASE_URL}{path}", **kwargs)
            response.raise_for_status()
            # If the response has a body, return it as text; otherwise confirm success.
            return response.text if response.text else f"Success ({response.status_code})"
    except httpx.HTTPStatusError as e:
        # Surface the backend's error message so Claude can explain it to the user.
        return f"Error {e.response.status_code}: {e.response.text}"
    except httpx.RequestError as e:
        return f"Connection error: {str(e)}. Is the Spring Boot backend running?"


# --- Tools ----------------------------------------------------------------
# Each function decorated with @mcp.tool() becomes a tool in the MCP server.
#
# How MCP uses these functions:
#   1. The function NAME        → tool name the client calls
#   2. The docstring            → tool description shown to the LLM
#   3. The parameter names      → what the LLM must supply as arguments
#   4. The type hints           → used to auto-generate the JSON input schema
#   5. The return value (str)   → the result Claude reads after calling the tool


@mcp.tool()
def list_policies() -> str:
    """
    Retrieve all insurance policies from the system.
    Returns a JSON array of all policies with their details.
    """
    return _request("GET", "/policies")


@mcp.tool()
def get_policy(policy_id: int) -> str:
    """
    Retrieve a single insurance policy by its ID.

    Args:
        policy_id: The numeric ID of the policy to retrieve.
    """
    return _request("GET", f"/policies/{policy_id}")


@mcp.tool()
def create_policy(
    holder_name: str,
    policy_type: str,
    coverage_amount: float,
    premium: float,
    start_date: str,
    end_date: str,
) -> str:
    """
    Create a new insurance policy.

    Args:
        holder_name:     Full name of the policy holder (e.g. "Jane Smith").
        policy_type:     Type of insurance (e.g. "HEALTH", "AUTO", "HOME").
        coverage_amount: Total coverage value in dollars (e.g. 100000.0).
        premium:         Monthly premium amount in dollars (e.g. 250.0).
        start_date:      Policy start date in YYYY-MM-DD format.
        end_date:        Policy end date in YYYY-MM-DD format.
    """
    payload = {
        "holderName": holder_name,
        "policyType": policy_type,
        "coverageAmount": coverage_amount,
        "premium": premium,
        "startDate": start_date,
        "endDate": end_date,
    }
    return _request("POST", "/policies", json=payload)


@mcp.tool()
def update_policy(
    policy_id: int,
    holder_name: str,
    policy_type: str,
    coverage_amount: float,
    premium: float,
    start_date: str,
    end_date: str,
) -> str:
    """
    Update an existing insurance policy.

    Args:
        policy_id:       ID of the policy to update.
        holder_name:     Updated holder name.
        policy_type:     Updated policy type.
        coverage_amount: Updated coverage amount in dollars.
        premium:         Updated monthly premium in dollars.
        start_date:      Updated start date in YYYY-MM-DD format.
        end_date:        Updated end date in YYYY-MM-DD format.
    """
    payload = {
        "holderName": holder_name,
        "policyType": policy_type,
        "coverageAmount": coverage_amount,
        "premium": premium,
        "startDate": start_date,
        "endDate": end_date,
    }
    return _request("PUT", f"/policies/{policy_id}", json=payload)


@mcp.tool()
def get_policy_events(policy_id: int) -> str:
    """
    Retrieve the full audit event history for a policy from MongoDB.
    Shows every create/update operation ever performed on this policy.

    Args:
        policy_id: The numeric ID of the policy whose history to retrieve.
    """
    return _request("GET", f"/events/{policy_id}")


# --- Entry point ----------------------------------------------------------
# mcp.run() starts the server using stdio transport by default.
# Claude Code (or any MCP client) launches this as a subprocess and
# communicates via stdin/stdout using the MCP protocol (JSON-RPC 2.0).

if __name__ == "__main__":
    mcp.run()
