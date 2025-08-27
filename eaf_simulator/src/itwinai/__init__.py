"""
Mock itwinai module for EAF Simulator
This provides the basic classes and decorators needed for the simulator to run
"""

import logging
from typing import Dict, Any, List
from abc import ABC, abstractmethod

# Mock BaseComponent
class BaseComponent(ABC):
    def __init__(self, name: str = "Component"):
        self.name = name
        self.logger = logging.getLogger(name)
    
    @abstractmethod
    def execute(self) -> Dict[str, Any]:
        pass

# Mock Pipeline
class Pipeline:
    def __init__(self, steps: Dict[str, BaseComponent], name: str = "Pipeline"):
        self.steps = steps
        self.name = name
        self.logger = logging.getLogger(name)
    
    def execute(self) -> Dict[str, Any]:
        results = {}
        for step_name, step in self.steps.items():
            self.logger.info(f"Executing step: {step_name}")
            try:
                step_result = step.execute()
                results[step_name] = step_result
            except Exception as e:
                self.logger.error(f"Step {step_name} failed: {e}")
                results[step_name] = {"error": str(e)}
        return results

# Mock Logger
class Logger:
    def __init__(self, name: str = "Logger"):
        self.logger = logging.getLogger(name)
    
    def info(self, message: str):
        self.logger.info(message)
    
    def error(self, message: str):
        self.logger.error(message)
    
    def warning(self, message: str):
        self.logger.warning(message)
    
    def debug(self, message: str):
        self.logger.debug(message)

# Mock LogMixin
class LogMixin:
    @property
    def logger(self):
        if not hasattr(self, '_logger'):
            self._logger = Logger(self.__class__.__name__)
        return self._logger
    
    def log(self, level: str, message: str):
        """Log a message at the specified level"""
        if level == "info":
            self.logger.info(message)
        elif level == "error":
            self.logger.error(message)
        elif level == "warning":
            self.logger.warning(message)
        elif level == "debug":
            self.logger.debug(message)
        else:
            self.logger.info(message)  # Default to info

# Mock monitor_exec decorator
def monitor_exec(func):
    def wrapper(*args, **kwargs):
        # Simple monitoring wrapper
        return func(*args, **kwargs)
    return wrapper

# Export all the mock classes
__all__ = [
    "BaseComponent",
    "Pipeline", 
    "Logger",
    "LogMixin",
    "monitor_exec"
]
