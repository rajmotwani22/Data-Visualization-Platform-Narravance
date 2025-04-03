#!/usr/bin/env python3
"""
Redis Connection Diagnostic Script

This script verifies connectivity to Redis and performs basic operations.
Run this script to diagnose Redis connection issues.
"""

import sys
import time
import redis

# Default Redis URL
REDIS_URL = "redis://localhost:6379/0"

def main():
    print(f"Redis Connection Diagnostic Tool")
    print(f"================================\n")
    
    # Get Redis URL from command line if provided
    redis_url = sys.argv[1] if len(sys.argv) > 1 else REDIS_URL
    print(f"Testing connection to: {redis_url}\n")
    
    try:
        # Test basic connection
        print("Step 1: Testing basic connection...")
        client = redis.from_url(redis_url)
        pong = client.ping()
        print(f"  Connection successful: {pong}\n")
        
        # Get server info
        print("Step 2: Getting Redis server info...")
        info = client.info()
        print(f"  Redis version: {info.get('redis_version', 'unknown')}")
        print(f"  Connected clients: {info.get('connected_clients', 'unknown')}")
        print(f"  Used memory: {info.get('used_memory_human', 'unknown')}")
        print(f"  Total commands processed: {info.get('total_commands_processed', 'unknown')}")
        print(f"  Uptime: {info.get('uptime_in_days', 'unknown')} days\n")
        
        # Test basic operations
        print("Step 3: Testing basic Redis operations...")
        
        # Set operation
        print("  Testing SET operation...")
        client.set("test:diagnostic", "hello")
        
        # Get operation
        print("  Testing GET operation...")
        value = client.get("test:diagnostic")
        print(f"  Retrieved value: {value.decode('utf-8') if isinstance(value, bytes) else value}\n")
        
        # List operations
        print("  Testing LIST operations...")
        client.delete("test:list")
        client.rpush("test:list", "item1", "item2", "item3")
        list_len = client.llen("test:list")
        print(f"  List length: {list_len}")
        list_items = client.lrange("test:list", 0, -1)
        print(f"  List items: {[item.decode('utf-8') if isinstance(item, bytes) else item for item in list_items]}\n")
        
        # Hash operations
        print("  Testing HASH operations...")
        client.delete("test:hash")
        client.hset("test:hash", "field1", "value1")
        client.hset("test:hash", "field2", "value2")
        hash_len = client.hlen("test:hash")
        print(f"  Hash length: {hash_len}")
        hash_all = client.hgetall("test:hash")
        print(f"  Hash contents: {[(k.decode('utf-8') if isinstance(k, bytes) else k, v.decode('utf-8') if isinstance(v, bytes) else v) for k, v in hash_all.items()]}\n")
        
        # Test cleanup
        print("Step 4: Cleaning up test keys...")
        client.delete("test:diagnostic", "test:list", "test:hash")
        print("  Cleanup complete\n")
        
        print("Diagnostic Summary")
        print("=================")
        print("✅ Redis connection is working properly")
        print("✅ Basic Redis operations are successful")
        
    except redis.ConnectionError as e:
        print(f"\n❌ Connection Error: {str(e)}")
        print("\nPossible solutions:")
        print("1. Verify Redis server is running: systemctl status redis")
        print("2. Check if Redis is listening on the expected port: netstat -tulpn | grep 6379")
        print("3. Make sure your firewall allows connections to Redis port")
        print("4. Check if the Redis URL is correct")
        return 1
        
    except redis.RedisError as e:
        print(f"\n❌ Redis Error: {str(e)}")
        return 1
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return 1
        
    return 0

if __name__ == "__main__":
    sys.exit(main())