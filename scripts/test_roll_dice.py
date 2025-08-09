#!/usr/bin/env python3
"""
Test script to call the rollDice GraphQL mutation with Cognito authentication.
"""

import json
import sys
import os
import urllib.request
import urllib.parse
import urllib.error
import concurrent.futures
import threading
import time
import math
from dataclasses import dataclass
from typing import Optional, List

@dataclass
class DiceRoll:
    value: int
    grade: str
    error: Optional[str] = None
    
    @property
    def is_success(self) -> bool:
        return self.error is None
    
    @property
    def is_error(self) -> bool:
        return self.error is not None

def get_cognito_token(username, password, user_pool_id, client_id, region):
    """Authenticate with Cognito and get access token"""
    
    # Cognito Identity Provider endpoint
    cognito_idp_url = f"https://cognito-idp.{region}.amazonaws.com/"
    
    payload = {
        'AuthFlow': 'USER_PASSWORD_AUTH',
        'ClientId': client_id,
        'AuthParameters': {
            'USERNAME': username,
            'PASSWORD': password
        }
    }
    
    data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(
        cognito_idp_url, 
        data=data,
        headers={
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
            'Content-Type': 'application/x-amz-json-1.1'
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            
        if 'AuthenticationResult' in result:
            return result['AuthenticationResult']['AccessToken']
        else:
            return None
            
    except urllib.error.HTTPError:
        return None

def test_roll_dice(access_token, graphql_url, game_id):
    """Test the rollDice GraphQL mutation"""
    
    # rollDice mutation
    mutation = """
    mutation rollDice($input: RollDiceInput!) {
      rollDice(input: $input) {
        gameId playerId playerName
        dice { ... on SingleDie { __typename type size value } }
        rollType target grade action
        diceList { ... on SingleDie { __typename type size value } }
        value rolledAt rolledBy proxyRoll type messageIndex
      }
    }
    """
    
    # Test variables
    variables = {
        "input": {
            "gameId": game_id,
            "dice": [{"type": "d100", "size": 100}],
            "rollType": "deltaGreen",
            "target": 50
        }
    }
    
    payload = {
        "query": mutation,
        "variables": variables
    }
    
    data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(
        graphql_url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
        status = response.status
    except urllib.error.HTTPError as e:
        result = json.loads(e.read().decode('utf-8'))
        status = e.code
    
    return status, result

def make_single_roll(access_token, graphql_url, game_id):
    """Make a single roll and return the result"""
    
    mutation = """
    mutation rollDice($input: RollDiceInput!) {
      rollDice(input: $input) {
        diceList { ... on SingleDie { value } }
        grade
      }
    }
    """
    
    variables = {
        "input": {
            "gameId": game_id,
            "dice": [{"type": "d100", "size": 100}],
            "rollType": "deltaGreen",
            "target": 50
        }
    }
    
    payload = {
        "query": mutation,
        "variables": variables
    }
    
    data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(
        graphql_url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
        
        if 'errors' in result:
            error_msg = result['errors'][0].get('message', 'GraphQL error')
            return DiceRoll(-1, 'ERROR', error_msg)
        
        if 'data' in result and result['data'].get('rollDice'):
            roll = result['data']['rollDice']
            return DiceRoll(roll['diceList'][0]['value'], roll['grade'])
        else:
            return DiceRoll(-1, 'ERROR', 'No roll data returned')
            
    except urllib.error.HTTPError as e:
        return DiceRoll(-1, 'ERROR', f'HTTP {e.code}')
    except Exception as e:
        return DiceRoll(-1, 'ERROR', str(e))

def make_100_rolls(access_token, graphql_url, game_id):
    """Make 100 rolls concurrently and return list of DiceRoll objects"""
    
    results = []
    
    def roll_worker():
        return make_single_roll(access_token, graphql_url, game_id)
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        # Submit all 100 rolls
        futures = [executor.submit(roll_worker) for _ in range(100)]
        
        # Collect results as they complete
        for future in concurrent.futures.as_completed(futures):
            try:
                dice_roll = future.result()
                results.append(dice_roll)
            except Exception as e:
                results.append(DiceRoll(-1, 'ERROR', f'Exception: {str(e)}'))
    
    return results

def _get_graph_colors():
    """Get color codes for different dice roll grades"""
    return {
        'CRITICAL_SUCCESS': '\033[92m',  # Green
        'SUCCESS': '\033[94m',           # Blue  
        'FAILURE': '\033[93m',           # Yellow
        'FUMBLE': '\033[91m',            # Red
        'ERROR': '\033[95m'              # Magenta
    }

def _count_rolls_by_value(successful_rolls):
    """Count rolls grouped by their values"""
    roll_counts = {}
    for roll in successful_rolls:
        if roll.value not in roll_counts:
            roll_counts[roll.value] = []
        roll_counts[roll.value].append(roll)
    return roll_counts

def _print_graph_scale(min_val, max_val, range_size):
    """Print the scale line showing value range"""
    if range_size <= 50:
        # Short range - show min and max
        padding = " " * (range_size - len(str(min_val)) - len(str(max_val)))
        print(f"{min_val}{padding}{max_val}")
    else:
        # Long range - show min, middle, max
        mid_val = (min_val + max_val) // 2
        left_pad = (range_size - len(str(min_val)) - len(str(mid_val))) // 2
        right_pad = range_size - len(str(min_val)) - len(str(mid_val)) - len(str(max_val)) - left_pad
        print(f"{min_val}{' ' * left_pad}{mid_val}{' ' * right_pad}{max_val}")

def _find_min_full_line(roll_counts, min_val, max_val, max_count):
    """Find the minimum line level where all positions are filled"""
    min_full_line = 1
    for line in range(1, max_count + 1):
        all_filled = True
        for val in range(min_val, max_val + 1):
            rolls_at_val = roll_counts.get(val, [])
            if len(rolls_at_val) < line:
                all_filled = False
                break
        if all_filled:
            min_full_line = line
        else:
            break
    return min_full_line

def _determine_lines_to_show(is_bottom_line_full, max_count, min_full_line):
    """Determine which graph lines to display"""
    if is_bottom_line_full and max_count > min_full_line:
        # Show partial lines plus only the topmost full line
        lines_to_show = list(range(max_count, min_full_line, -1)) + [min_full_line]
        lines_not_shown = min_full_line - 1
        show_summary = True
    else:
        # Show all lines (original behavior)
        lines_to_show = range(max_count, 0, -1)
        lines_not_shown = 0
        show_summary = False
    return lines_to_show, lines_not_shown, show_summary

def _draw_graph_line(line, min_val, max_val, roll_counts, colors, reset):
    """Draw a single line of the frequency graph"""
    graph_line = []
    for val in range(min_val, max_val + 1):
        rolls_at_val = roll_counts.get(val, [])
        
        if len(rolls_at_val) >= line:
            # Show a mark for this line level
            roll = rolls_at_val[0]  # Use first roll for color
            color = colors.get(roll.grade, '')
            graph_line.append(f"{color}█{reset}")
        else:
            graph_line.append('.')
    
    print(''.join(graph_line))

def draw_roll_graph(results):
    """Draw a horizontal graph with one character per roll value, multiple lines for frequency"""
    colors = _get_graph_colors()
    reset = '\033[0m'
    
    # Get successful rolls only for the graph
    successful_rolls = [roll for roll in results if roll.is_success]
    
    if not successful_rolls:
        print("No successful rolls to graph")
        return
    
    # Count rolls per value and find range
    roll_counts = _count_rolls_by_value(successful_rolls)
    min_val = min(roll.value for roll in successful_rolls)
    max_val = max(roll.value for roll in successful_rolls)
    range_size = max_val - min_val + 1
    max_count = max(len(rolls) for rolls in roll_counts.values()) if roll_counts else 0
    
    # Print scale
    _print_graph_scale(min_val, max_val, range_size)
    
    # Check if bottom line would be solid
    filled_positions = sum(1 for val in range(min_val, max_val + 1) if roll_counts.get(val, []))
    total_positions = max_val - min_val + 1
    is_bottom_line_full = filled_positions == total_positions
    
    # Find minimum full line and determine what to show
    min_full_line = _find_min_full_line(roll_counts, min_val, max_val, max_count) if is_bottom_line_full else 1
    lines_to_show, lines_not_shown, show_summary = _determine_lines_to_show(is_bottom_line_full, max_count, min_full_line)
    
    # Draw the graph lines
    for line in lines_to_show:
        _draw_graph_line(line, min_val, max_val, roll_counts, colors, reset)
    
    # Show summary if we omitted full lines
    if show_summary:
        print(f"[{lines_not_shown} line(s) with all values filled not shown]")

def calculate_chi_square(values: List[int]) -> tuple[float, float, str]:
    """Calculate chi-square goodness of fit test for uniform distribution"""
    if not values:
        return 0.0, 1.0, "ERROR: No data"
    
    min_val = min(values)
    max_val = max(values)
    num_categories = max_val - min_val + 1
    n = len(values)
    
    # Expected frequency for uniform distribution
    expected_freq = n / num_categories
    
    # Count observed frequencies
    observed_counts = {}
    for val in values:
        observed_counts[val] = observed_counts.get(val, 0) + 1
    
    # Calculate chi-square statistic
    chi_square = 0.0
    for val in range(min_val, max_val + 1):
        observed = observed_counts.get(val, 0)
        chi_square += (observed - expected_freq) ** 2 / expected_freq
    
    # Degrees of freedom
    df = num_categories - 1
    
    # Simple p-value approximation (not exact, but good enough for assessment)
    # For large df, chi-square approaches normal distribution
    if df > 30:
        # Normal approximation
        z_score = (chi_square - df) / math.sqrt(2 * df)
        p_value = 0.5 * (1 + math.erf(-abs(z_score) / math.sqrt(2)))
    else:
        # Rough approximation for smaller df
        critical_values = {
            1: 3.841, 10: 18.307, 20: 31.410, 30: 43.773, 40: 55.758,
            50: 67.505, 60: 79.082, 70: 90.531, 80: 101.879, 90: 113.145, 99: 123.225
        }
        # Find closest critical value
        closest_df = min(critical_values.keys(), key=lambda x: abs(x - df))
        critical_val = critical_values[closest_df]
        p_value = 0.05 if chi_square < critical_val else 0.01
    
    # Assessment
    if p_value > 0.05:
        assessment = "GOOD - Distribution appears random"
    elif p_value > 0.01:
        assessment = "FAIR - Some deviation from randomness"
    else:
        assessment = "POOR - Significant deviation from randomness"
    
    return chi_square, p_value, assessment

def calculate_entropy(values: List[int]) -> tuple[float, float, str]:
    """Calculate Shannon entropy of the distribution"""
    if not values:
        return 0.0, 0.0, "ERROR: No data"
    
    min_val = min(values)
    max_val = max(values)
    num_categories = max_val - min_val + 1
    n = len(values)
    
    # Count frequencies
    counts = {}
    for val in values:
        counts[val] = counts.get(val, 0) + 1
    
    # Calculate entropy
    entropy = 0.0
    for count in counts.values():
        if count > 0:
            probability = count / n
            entropy -= probability * math.log2(probability)
    
    # Maximum possible entropy for uniform distribution
    max_entropy = math.log2(num_categories)
    
    # Entropy ratio (0 to 1, where 1 is perfectly random)
    entropy_ratio = entropy / max_entropy if max_entropy > 0 else 0.0
    
    # Assessment
    if entropy_ratio > 0.95:
        assessment = "EXCELLENT - Very high entropy"
    elif entropy_ratio > 0.90:
        assessment = "GOOD - High entropy"
    elif entropy_ratio > 0.80:
        assessment = "FAIR - Moderate entropy"
    else:
        assessment = "POOR - Low entropy, not very random"
    
    return entropy, entropy_ratio, assessment

def calculate_frequency_variance(values: List[int]) -> tuple[float, str]:
    """Calculate variance in frequencies across all possible values"""
    if not values:
        return 0.0, "ERROR: No data"
    
    min_val = min(values)
    max_val = max(values)
    n = len(values)
    num_categories = max_val - min_val + 1
    expected_freq = n / num_categories
    
    # Count frequencies
    counts = {}
    for val in values:
        counts[val] = counts.get(val, 0) + 1
    
    # Calculate variance from expected frequency
    variance = 0.0
    for val in range(min_val, max_val + 1):
        observed = counts.get(val, 0)
        variance += (observed - expected_freq) ** 2
    
    variance /= num_categories
    std_dev = math.sqrt(variance)
    
    # For truly random data, std deviation should be close to sqrt(expected_freq)
    expected_std = math.sqrt(expected_freq)
    ratio = std_dev / expected_std if expected_std > 0 else 0.0
    
    # Assessment
    if 0.8 <= ratio <= 1.2:
        assessment = "GOOD - Variance within expected range"
    elif 0.6 <= ratio <= 1.4:
        assessment = "FAIR - Variance slightly outside expected range"
    else:
        assessment = "POOR - Variance significantly different from expected"
    
    return std_dev, assessment

def analyze_randomness(results: List[DiceRoll]):
    """Analyze randomness of successful dice rolls"""
    successful_rolls = [roll for roll in results if roll.is_success]
    
    if not successful_rolls:
        print("\nRANDOMNESS ANALYSIS:")
        print("No successful rolls to analyze")
        return
    
    values = [roll.value for roll in successful_rolls]
    n = len(values)
    
    print(f"\nRANDOMNESS ANALYSIS ({n} successful rolls):")
    print("=" * 50)
    
    # Basic statistics
    min_val, max_val = min(values), max(values)
    range_size = max_val - min_val + 1
    print(f"Range: {min_val}-{max_val} ({range_size} possible values)")
    print(f"Expected frequency per value: {n/range_size:.1f}")
    
    # Chi-square test
    chi_sq, p_val, chi_assessment = calculate_chi_square(values)
    print("\nChi-square test:")
    print(f"  χ² = {chi_sq:.2f}, p ≈ {p_val:.3f}")
    print(f"  {chi_assessment}")
    
    # Entropy analysis
    entropy, entropy_ratio, entropy_assessment = calculate_entropy(values)
    print("\nEntropy analysis:")
    print(f"  Entropy = {entropy:.2f} bits (ratio: {entropy_ratio:.3f})")
    print(f"  {entropy_assessment}")
    
    # Frequency variance
    freq_std, freq_assessment = calculate_frequency_variance(values)
    print("\nFrequency variance:")
    print(f"  Standard deviation = {freq_std:.2f}")
    print(f"  {freq_assessment}")
    
    # Overall assessment
    good_tests = sum([
        "GOOD" in chi_assessment or "EXCELLENT" in chi_assessment,
        "GOOD" in entropy_assessment or "EXCELLENT" in entropy_assessment,
        "GOOD" in freq_assessment
    ])
    
    print("\nOVERALL ASSESSMENT:")
    if good_tests >= 3:
        print("✓ EXCELLENT - All tests indicate good randomness")
    elif good_tests >= 2:
        print("✓ GOOD - Most tests indicate acceptable randomness")
    elif good_tests >= 1:
        print("⚠ FAIR - Some concerns about randomness")
    else:
        print("✗ POOR - Multiple indicators suggest poor randomness")

def main():
    # Get max loops from command line argument, default to 600
    max_loops = 600
    if len(sys.argv) > 1:
        try:
            max_loops = int(sys.argv[1])
        except ValueError:
            print(f"Error: Invalid number of loops '{sys.argv[1]}'. Using default of 600.")
    
    # Get required environment variables
    graphql_url = os.getenv('GRAPHQL_URL')
    user_pool_id = os.getenv('COGNITO_USER_POOL_ID')
    client_id = os.getenv('COGNITO_CLIENT_ID')
    region = os.getenv('AWS_REGION')
    game_id = os.getenv('GAME_ID')
    username = os.getenv('COGNITO_USERNAME')
    password = os.getenv('COGNITO_PASSWORD')
    
    if not all([graphql_url, user_pool_id, client_id, region, game_id, username, password]):
        print("Error: Missing required environment variables")
        print("Required: GRAPHQL_URL, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, AWS_REGION, GAME_ID, COGNITO_USERNAME, COGNITO_PASSWORD")
        sys.exit(1)
    
    print("Getting Cognito access token...")
    access_token = get_cognito_token(username, password, user_pool_id, client_id, region)
    
    if not access_token:
        print("Failed to get access token")
        sys.exit(1)
    
    # Continuous rolling loop
    all_results = []
    loop_count = 0
    
    try:
        while loop_count < max_loops:
            # Get 100 more rolls
            batch_results = make_100_rolls(access_token, graphql_url, game_id)
            all_results.extend(batch_results)
            loop_count += 1
            
            # Clear screen and draw graph
            print('\033[2J\033[H', end='')
            print(f"Loop {loop_count}/{max_loops} - Total rolls: {len(all_results)}")
            draw_roll_graph(all_results)
            analyze_randomness(all_results)
            
            # Sleep before next batch
            time.sleep(0.5)
            
    except KeyboardInterrupt:
        print(f"\nStopped after {loop_count} loops with {len(all_results)} total rolls")

if __name__ == "__main__":
    main()