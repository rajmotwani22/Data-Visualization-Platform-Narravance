import threading
import time
import logging
import json
import traceback
import redis
from sqlalchemy.orm import Session
from models import Task, TaskStatus, SalesData
from data_sources.json_source import JSONDataSource
from data_sources.csv_source import CSVDataSource
from data_sources.api_source import APIDataSource
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QueueManager:
    def __init__(self, db_session_factory, use_redis=True, redis_url="redis://localhost:6379/0"):
        self.db_session_factory = db_session_factory
        self.worker_thread = None
        self.running = False
        
        # Redis configuration
        self.use_redis = use_redis
        self.redis_url = redis_url
        self.redis_client = None
        
        if self.use_redis:
            try:
                self.redis_client = redis.from_url(self.redis_url)
                # Test connection
                self.redis_client.ping()
                logger.info(f"Successfully connected to Redis at {self.redis_url}")
            except Exception as e:
                logger.error(f"Failed to connect to Redis at {self.redis_url}: {str(e)}")
                logger.error(f"Falling back to in-memory queue.")
                self.use_redis = False
        
        # Fall back to in-memory queue if Redis is not available
        if not self.use_redis:
            import queue
            self.queue = queue.Queue()
            logger.info("Using in-memory queue")
        
    def start(self):
        if self.running:
            return
            
        self.running = True
        self.worker_thread = threading.Thread(target=self._process_queue)
        self.worker_thread.daemon = True
        self.worker_thread.start()
        logger.info("Queue manager started")
        
    def stop(self):
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=5)
        logger.info("Queue manager stopped")
        
    def add_task(self, task_id):
        if self.use_redis:
            try:
                # Add task to Redis list
                self.redis_client.rpush("task_queue", task_id)
                # Store initial task metadata
                self.redis_client.hset(f"task:{task_id}", "status", "queued")
                self.redis_client.hset(f"task:{task_id}", "queued_at", datetime.utcnow().isoformat())
                # Add to the set of all tasks
                self.redis_client.sadd("all_tasks", task_id)
                logger.info(f"Task {task_id} added to Redis queue")
            except Exception as e:
                logger.error(f"Error adding task to Redis queue: {str(e)}")
                logger.error(f"Falling back to in-memory queue for this task")
                if not hasattr(self, 'queue'):
                    import queue
                    self.queue = queue.Queue()
                self.queue.put(task_id)
        else:
            # Fallback to in-memory queue
            self.queue.put(task_id)
            logger.info(f"Task {task_id} added to in-memory queue")
        
    def _process_queue(self):
        while self.running:
            try:
                if self.use_redis:
                    # Pop task from Redis list with a blocking timeout
                    result = self.redis_client.blpop("task_queue", timeout=1)
                    if result:
                        _, task_id_bytes = result
                        task_id = int(task_id_bytes.decode('utf-8'))
                        # Update task status in Redis
                        self.redis_client.hset(f"task:{task_id}", "status", "processing")
                        self.redis_client.hset(f"task:{task_id}", "started_at", datetime.utcnow().isoformat())
                        
                        # Process the task
                        self._process_task(task_id)
                        
                        # Mark as done in Redis
                        self.redis_client.hset(f"task:{task_id}", "status", "completed")
                        self.redis_client.hset(f"task:{task_id}", "completed_at", datetime.utcnow().isoformat())
                    # No else block needed - if no result, we'll just loop back and wait again
                else:
                    try:
                        # Use in-memory queue with timeout
                        task_id = self.queue.get(block=True, timeout=1)
                        self._process_task(task_id)
                        self.queue.task_done()
                    except Exception as e:
                        # This is likely just a queue.Empty exception which is expected 
                        # when the queue is empty and we hit the timeout
                        if not str(e).startswith('Empty'):  # Only log if it's not the expected Empty exception
                            logger.error(f"Error in in-memory queue: {str(e)}")
                        time.sleep(0.1)  # Small sleep to prevent CPU spinning
            except redis.RedisError as e:
                logger.error(f"Redis error: {str(e)}. Retrying in 5 seconds...")
                time.sleep(5)
            except Exception as e:
                logger.error(f"Error processing queue: {str(e)}")
                logger.error(traceback.format_exc())  # Log the full traceback for debugging
                
                if self.use_redis and 'task_id' in locals():
                    try:
                        # Track failed tasks in Redis
                        self.redis_client.hset(f"task:{task_id}", "status", "failed")
                        self.redis_client.hset(f"task:{task_id}", "error", str(e))
                        self.redis_client.hset(f"task:{task_id}", "failed_at", datetime.utcnow().isoformat())
                        self.redis_client.sadd("failed_tasks", task_id)
                    except Exception as redis_e:
                        logger.error(f"Failed to record task failure in Redis: {str(redis_e)}")
                
                time.sleep(1)  # Prevent tight loop in case of persistent errors
                
    def _process_task(self, task_id):
        logger.info(f"Processing task {task_id}")
        
        db = self.db_session_factory()
        try:
            # Get task from database
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                logger.error(f"Task {task_id} not found")
                return
            
            # Update status to IN_PROGRESS
            task.status = TaskStatus.IN_PROGRESS
            db.commit()
            
            # Process data from source A (JSON)
            json_source = JSONDataSource()
            source_a_data = json_source.get_data(task.parameters.get('source_a', {}))
            
            # Process data from source B (CSV)
            csv_source = CSVDataSource()
            source_b_data = csv_source.get_data(task.parameters.get('source_b', {}))
            
            # Process data from source C (API) if provided
            api_source = APIDataSource()
            source_c_data = api_source.get_data(task.parameters.get('source_c', {}))
            
            # Save data to database
            json_source.save_data(db, task.id, source_a_data)
            csv_source.save_data(db, task.id, source_b_data)
            api_source.save_data(db, task.id, source_c_data)
            
            # Track progress in Redis if enabled
            if self.use_redis:
                self.redis_client.hset(f"task:{task_id}", "progress", 100)
                self.redis_client.hset(f"task:{task_id}", "records_processed", 
                    len(source_a_data) + len(source_b_data) + len(source_c_data))
            
            # Update status to COMPLETED
            task.status = TaskStatus.COMPLETED
            db.commit()
            
            logger.info(f"Task {task_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Error processing task {task_id}: {str(e)}")
            logger.error(traceback.format_exc())  # Log the full traceback for debugging
            
            # Update task status to FAILED
            try:
                task.status = TaskStatus.FAILED
                db.commit()
            except Exception as db_e:
                logger.error(f"Failed to update task status: {str(db_e)}")
            
            # Record error details in Redis if enabled
            if self.use_redis:
                try:
                    self.redis_client.hset(f"task:{task_id}", "error_details", str(e))
                    self.redis_client.hset(f"task:{task_id}", "error_time", datetime.utcnow().isoformat())
                except Exception as redis_e:
                    logger.error(f"Failed to record error in Redis: {str(redis_e)}")
                
            raise  # Re-raise to be caught by the outer exception handler
        finally:
            db.close()
            
    def get_queue_stats(self):
        """Get statistics about the task queue"""
        if not self.use_redis or not self.redis_client:
            return {
                "queue_size": self.queue.qsize() if hasattr(self, 'queue') else "unknown",
                "redis_status": "disabled"
            }
            
        try:
            queue_size = self.redis_client.llen("task_queue")
            total_tasks = self.redis_client.scard("all_tasks")
            failed_tasks = self.redis_client.scard("failed_tasks")
            
            # Get the last 5 processed tasks
            all_tasks = self.redis_client.smembers("all_tasks")
            recent_tasks = []
            
            for task_id_bytes in list(sorted(all_tasks))[-5:]:
                task_id = task_id_bytes.decode('utf-8') if isinstance(task_id_bytes, bytes) else task_id_bytes
                task_data = self.redis_client.hgetall(f"task:{task_id}")
                
                if task_data:
                    # Convert bytes to strings
                    task_info = {k.decode('utf-8') if isinstance(k, bytes) else k: 
                                v.decode('utf-8') if isinstance(v, bytes) else v 
                                for k, v in task_data.items()}
                    task_info['id'] = task_id
                    recent_tasks.append(task_info)
            
            return {
                "queue_size": queue_size,
                "total_tasks": total_tasks,
                "failed_tasks": failed_tasks,
                "recent_tasks": recent_tasks,
                "redis_status": "connected"
            }
        except redis.RedisError as e:
            logger.error(f"Redis error when getting stats: {str(e)}")
            return {
                "queue_size": "unknown",
                "redis_status": "error",
                "error": str(e)
            }