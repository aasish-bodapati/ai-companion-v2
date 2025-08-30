"""
Performance tests for memory operations under load.

These tests measure system performance under various load conditions.
"""

import pytest
import time
import concurrent.futures
from fastapi.testclient import TestClient
from unittest.mock import patch
import statistics


class TestMemoryLoadPerformance:
    """Test memory operations under load."""
    
    @pytest.mark.performance
    @pytest.mark.slow
    def test_memory_creation_load(self, client, test_user):
        """Test memory creation performance under load."""
        num_concurrent_requests = 10
        memories_per_request = 5
        
        def create_memories_batch(batch_id):
            """Create a batch of memories."""
            memories_created = []
            start_time = time.time()
            
            for i in range(memories_per_request):
                memory_data = {
                    "content": f"Load test memory {batch_id}-{i}",
                    "memory_type": "test",
                    "importance": 0.5 + (i % 5) * 0.1
                }
                
                response = client.post("/api/memories/", json=memory_data)
                if response.status_code == 201:
                    memories_created.append(response.json())
            
            end_time = time.time()
            return {
                "batch_id": batch_id,
                "memories_created": len(memories_created),
                "time_taken": end_time - start_time,
                "memories": memories_created
            }
        
        # Execute concurrent memory creation
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent_requests) as executor:
            future_to_batch = {
                executor.submit(create_memories_batch, i): i 
                for i in range(num_concurrent_requests)
            }
            
            results = []
            for future in concurrent.futures.as_completed(future_to_batch):
                result = future.result()
                results.append(result)
        
        total_time = time.time() - start_time
        
        # Analyze results
        total_memories = sum(result["memories_created"] for result in results)
        creation_times = [result["time_taken"] for result in results]
        
        # Performance metrics
        avg_creation_time = statistics.mean(creation_times)
        min_creation_time = min(creation_times)
        max_creation_time = max(creation_times)
        memories_per_second = total_memories / total_time
        
        # Assertions
        assert total_memories == num_concurrent_requests * memories_per_request
        assert avg_creation_time < 2.0, f"Average creation time too high: {avg_creation_time:.2f}s"
        assert max_creation_time < 5.0, f"Max creation time too high: {max_creation_time:.2f}s"
        assert memories_per_second > 5.0, f"Throughput too low: {memories_per_second:.2f} memories/s"
        
        # Clean up
        for result in results:
            for memory in result["memories"]:
                client.delete(f"/api/memories/{memory['id']}")
    
    @pytest.mark.performance
    @pytest.mark.slow
    def test_memory_search_load(self, client, test_user):
        """Test memory search performance under load."""
        # First, create test data
        num_memories = 100
        memories_data = [
            {
                "content": f"Search load test memory {i} with unique content {i}",
                "memory_type": "test",
                "importance": 0.5 + (i % 5) * 0.1
            }
            for i in range(num_memories)
        ]
        
        created_memories = []
        for memory_data in memories_data:
            response = client.post("/api/memories/", json=memory_data)
            assert response.status_code == 201
            created_memories.append(response.json())
        
        try:
            # Test concurrent search operations
            num_concurrent_searches = 20
            search_queries = [
                "unique content",
                "load test",
                "memory",
                "test",
                "search"
            ]
            
            def perform_search_batch(batch_id):
                """Perform a batch of searches."""
                search_times = []
                
                for query in search_queries:
                    start_time = time.time()
                    response = client.get(f"/api/memories/search?q={query}")
                    end_time = time.time()
                    
                    if response.status_code == 200:
                        search_times.append(end_time - start_time)
                
                return {
                    "batch_id": batch_id,
                    "search_times": search_times,
                    "avg_search_time": statistics.mean(search_times) if search_times else 0
                }
            
            # Execute concurrent searches
            start_time = time.time()
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent_searches) as executor:
                future_to_batch = {
                    executor.submit(perform_search_batch, i): i 
                    for i in range(num_concurrent_searches)
                }
                
                results = []
                for future in concurrent.futures.as_completed(future_to_batch):
                    result = future.result()
                    results.append(result)
            
            total_time = time.time() - start_time
            
            # Analyze search performance
            all_search_times = []
            for result in results:
                all_search_times.extend(result["search_times"])
            
            avg_search_time = statistics.mean(all_search_times)
            min_search_time = min(all_search_times)
            max_search_time = max(all_search_times)
            searches_per_second = len(all_search_times) / total_time
            
            # Assertions
            assert avg_search_time < 1.0, f"Average search time too high: {avg_search_time:.3f}s"
            assert max_search_time < 3.0, f"Max search time too high: {max_search_time:.3f}s"
            assert searches_per_second > 10.0, f"Search throughput too low: {searches_per_second:.2f} searches/s"
            
        finally:
            # Clean up
            for memory in created_memories:
                client.delete(f"/api/memories/{memory['id']}")
    
    @pytest.mark.performance
    @pytest.mark.slow
    def test_memory_mixed_operations_load(self, client, test_user):
        """Test mixed memory operations under load."""
        # Create initial test data
        num_initial_memories = 50
        memories_data = [
            {
                "content": f"Mixed operations test memory {i}",
                "memory_type": "test",
                "importance": 0.5 + (i % 5) * 0.1
            }
            for i in range(num_initial_memories)
        ]
        
        created_memories = []
        for memory_data in memories_data:
            response = client.post("/api/memories/", json=memory_data)
            assert response.status_code == 201
            created_memories.append(response.json())
        
        try:
            # Test mixed operations (create, read, update, delete)
            num_operations = 100
            
            def perform_mixed_operations(worker_id):
                """Perform a mix of memory operations."""
                operation_times = []
                
                for i in range(num_operations // 4):  # Divide operations among workers
                    # Create operation
                    start_time = time.time()
                    memory_data = {
                        "content": f"Worker {worker_id} mixed test {i}",
                        "memory_type": "test",
                        "importance": 0.5
                    }
                    create_response = client.post("/api/memories/", json=memory_data)
                    create_time = time.time() - start_time
                    
                    if create_response.status_code == 201:
                        memory = create_response.json()
                        operation_times.append(("create", create_time))
                        
                        # Read operation
                        start_time = time.time()
                        read_response = client.get(f"/api/memories/{memory['id']}")
                        read_time = time.time() - start_time
                        
                        if read_response.status_code == 200:
                            operation_times.append(("read", read_time))
                            
                            # Update operation
                            start_time = time.time()
                            update_data = {"content": f"Updated by worker {worker_id}"}
                            update_response = client.put(f"/api/memories/{memory['id']}", json=update_data)
                            update_time = time.time() - start_time
                            
                            if update_response.status_code == 200:
                                operation_times.append(("update", update_time))
                                
                                # Delete operation
                                start_time = time.time()
                                delete_response = client.delete(f"/api/memories/{memory['id']}")
                                delete_time = time.time() - start_time
                                
                                if delete_response.status_code == 204:
                                    operation_times.append(("delete", delete_time))
                
                return {
                    "worker_id": worker_id,
                    "operation_times": operation_times
                }
            
            # Execute mixed operations
            num_workers = 5
            start_time = time.time()
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
                future_to_worker = {
                    executor.submit(perform_mixed_operations, i): i 
                    for i in range(num_workers)
                }
                
                results = []
                for future in concurrent.futures.as_completed(future_to_worker):
                    result = future.result()
                    results.append(result)
            
            total_time = time.time() - start_time
            
            # Analyze mixed operation performance
            all_operation_times = []
            for result in results:
                all_operation_times.extend(result["operation_times"])
            
            # Group by operation type
            operation_types = {}
            for op_type, op_time in all_operation_times:
                if op_type not in operation_types:
                    operation_types[op_type] = []
                operation_types[op_type].append(op_time)
            
            # Performance assertions for each operation type
            for op_type, times in operation_types.items():
                avg_time = statistics.mean(times)
                max_time = max(times)
                
                if op_type == "create":
                    assert avg_time < 0.5, f"Create operations too slow: {avg_time:.3f}s"
                elif op_type == "read":
                    assert avg_time < 0.2, f"Read operations too slow: {avg_time:.3f}s"
                elif op_type == "update":
                    assert avg_time < 0.3, f"Update operations too slow: {avg_time:.3f}s"
                elif op_type == "delete":
                    assert avg_time < 0.2, f"Delete operations too slow: {avg_time:.3f}s"
                
                assert max_time < 2.0, f"Max {op_type} time too high: {max_time:.3f}s"
            
            # Overall throughput
            total_operations = len(all_operation_times)
            operations_per_second = total_operations / total_time
            assert operations_per_second > 20.0, f"Overall throughput too low: {operations_per_second:.2f} ops/s"
            
        finally:
            # Clean up any remaining memories
            response = client.get("/api/memories/user/")
            if response.status_code == 200:
                user_memories = response.json()
                for memory in user_memories:
                    if "Mixed operations test" in memory["content"]:
                        client.delete(f"/api/memories/{memory['id']}")


class TestMemoryScalability:
    """Test memory system scalability."""
    
    @pytest.mark.performance
    @pytest.mark.slow
    def test_memory_scalability_growth(self, client, test_user):
        """Test how memory operations scale with data size."""
        # Test with different data sizes
        data_sizes = [10, 50, 100]
        performance_metrics = {}
        
        for size in data_sizes:
            # Create test data
            memories_data = [
                {
                    "content": f"Scalability test memory {i}",
                    "memory_type": "test",
                    "importance": 0.5 + (i % 5) * 0.1
                }
                for i in range(size)
            ]
            
            created_memories = []
            start_time = time.time()
            
            for memory_data in memories_data:
                response = client.post("/api/memories/", json=memory_data)
                assert response.status_code == 201
                created_memories.append(response.json())
            
            creation_time = time.time() - start_time
            
            # Test search performance
            search_start = time.time()
            response = client.get("/api/memories/search?q=scalability")
            search_time = time.time() - search_start
            
            assert response.status_code == 200
            results = response.json()
            assert len(results) >= size
            
            # Store metrics
            performance_metrics[size] = {
                "creation_time": creation_time,
                "search_time": search_time,
                "creation_rate": size / creation_time,
                "search_rate": 1 / search_time
            }
            
            # Clean up
            for memory in created_memories:
                client.delete(f"/api/memories/{memory['id']}")
        
        # Analyze scalability
        sizes = list(performance_metrics.keys())
        creation_rates = [performance_metrics[size]["creation_rate"] for size in sizes]
        search_rates = [performance_metrics[size]["search_rate"] for size in sizes]
        
        # Performance should not degrade too much with size
        # Creation rate should remain relatively stable
        creation_rate_variance = statistics.variance(creation_rates)
        assert creation_rate_variance < 100.0, "Creation rate varies too much with data size"
        
        # Search rate should not drop too much
        min_search_rate = min(search_rates)
        max_search_rate = max(search_rates)
        search_rate_ratio = min_search_rate / max_search_rate
        assert search_rate_ratio > 0.5, f"Search performance degrades too much: {search_rate_ratio:.2f}"
