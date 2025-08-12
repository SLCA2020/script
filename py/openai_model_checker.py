#!/usr/bin/env python3
"""
OpenAI API Key 批量模型可用性检查工具

该脚本用于批量检查多个OpenAI API key对指定模型的可用性。
支持从配置文件读取API keys，并输出详细的检查结果。

使用方法:
    python openai_model_checker.py --model gpt-4 --config api_keys.txt
    python openai_model_checker.py --model gpt-3.5-turbo --keys key1,key2,key3
"""

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import aiohttp
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class OpenAIModelChecker:
    """OpenAI模型可用性检查器"""
    
    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.base_url = "https://api.openai.com/v1"
        
    async def check_model_availability(self, api_key: str, model: str) -> Dict[str, Any]:
        """
        检查指定API key对特定模型的可用性
        
        Args:
            api_key: OpenAI API密钥
            model: 要检查的模型名称
            
        Returns:
            包含检查结果的字典
        """
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # 测试数据
        test_payload = {
            "model": model,
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 1,
            "temperature": 0
        }
        
        result = {
            "api_key": api_key[:8] + "..." + api_key[-4:],  # 隐藏大部分key内容
            "model": model,
            "available": False,
            "error": None,
            "response_time": None,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        try:
            start_time = time.time()
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=test_payload
                ) as response:
                    end_time = time.time()
                    result["response_time"] = round(end_time - start_time, 2)
                    
                    if response.status == 200:
                        result["available"] = True
                        logger.info(f"✓ API key {result['api_key']} 可以使用模型 {model}")
                    else:
                        response_text = await response.text()
                        try:
                            error_data = json.loads(response_text)
                            error_message = error_data.get("error", {}).get("message", response_text)
                        except:
                            error_message = response_text
                        
                        result["error"] = f"HTTP {response.status}: {error_message}"
                        logger.warning(f"✗ API key {result['api_key']} 无法使用模型 {model}: {result['error']}")
                        
        except asyncio.TimeoutError:
            result["error"] = f"请求超时 (>{self.timeout}s)"
            logger.error(f"✗ API key {result['api_key']} 请求超时")
        except Exception as e:
            result["error"] = str(e)
            logger.error(f"✗ API key {result['api_key']} 检查失败: {str(e)}")
            
        return result
    
    async def batch_check(self, api_keys: List[str], model: str) -> List[Dict[str, Any]]:
        """
        批量检查多个API key的模型可用性
        
        Args:
            api_keys: API密钥列表
            model: 要检查的模型名称
            
        Returns:
            检查结果列表
        """
        logger.info(f"开始批量检查 {len(api_keys)} 个API key对模型 {model} 的可用性...")
        
        tasks = [self.check_model_availability(api_key, model) for api_key in api_keys]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常结果
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "api_key": api_keys[i][:8] + "..." + api_keys[i][-4:],
                    "model": model,
                    "available": False,
                    "error": str(result),
                    "response_time": None,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                })
            else:
                processed_results.append(result)
                
        return processed_results


def load_api_keys_from_file(file_path: str) -> List[str]:
    """从文件加载API keys"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            keys = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        logger.info(f"从文件 {file_path} 加载了 {len(keys)} 个API key")
        return keys
    except FileNotFoundError:
        logger.error(f"配置文件 {file_path} 不存在")
        return []
    except Exception as e:
        logger.error(f"读取配置文件失败: {str(e)}")
        return []


def parse_api_keys_from_string(keys_string: str) -> List[str]:
    """从逗号分隔的字符串解析API keys"""
    keys = [key.strip() for key in keys_string.split(',') if key.strip()]
    logger.info(f"解析了 {len(keys)} 个API key")
    return keys


def print_results(results: List[Dict[str, Any]]):
    """打印检查结果"""
    print("\n" + "="*80)
    print("OpenAI API Key 模型可用性检查结果")
    print("="*80)

    available_count = sum(1 for r in results if r["available"])
    total_count = len(results)

    print(f"总计: {total_count} 个API key, 可用: {available_count} 个, 不可用: {total_count - available_count} 个")
    print("-"*80)

    for i, result in enumerate(results, 1):
        status = "✓ 可用" if result["available"] else "✗ 不可用"
        response_time = f" ({result['response_time']}s)" if result["response_time"] else ""

        print(f"{i:2d}. {result['api_key']} | {result['model']} | {status}{response_time}")

        if result["error"]:
            print(f"     错误: {result['error']}")
        print()


def print_available_keys(results: List[Dict[str, Any]], original_keys: List[str]):
    """输出可用的完整API keys"""
    available_results = [r for r in results if r["available"]]

    if not available_results:
        print("\n" + "="*50)
        print("没有找到可用的API keys")
        print("="*50)
        return

    print("\n" + "="*50)
    print("可用的API Keys:")
    print("="*50)

    for result in available_results:
        # 通过前8位和后4位匹配原始key
        masked_key = result["api_key"]
        prefix = masked_key[:8]
        suffix = masked_key[-4:]

        # 找到匹配的完整key
        for original_key in original_keys:
            if original_key.startswith(prefix) and original_key.endswith(suffix):
                print(original_key)
                break


def save_results_to_json(results: List[Dict[str, Any]], output_file: str):
    """保存结果到JSON文件"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        logger.info(f"结果已保存到 {output_file}")
    except Exception as e:
        logger.error(f"保存结果失败: {str(e)}")


async def main():
    parser = argparse.ArgumentParser(description="OpenAI API Key 批量模型可用性检查工具")
    parser.add_argument("--model", "-m", required=True, help="要检查的模型名称 (如: gpt-4, gpt-3.5-turbo)")
    parser.add_argument("--config", "-c", help="包含API keys的配置文件路径")
    parser.add_argument("--keys", "-k", help="逗号分隔的API keys字符串")
    parser.add_argument("--output", "-o", help="输出结果到JSON文件")
    parser.add_argument("--timeout", "-t", type=int, default=30, help="请求超时时间(秒), 默认30秒")
    
    args = parser.parse_args()
    
    # 获取API keys
    api_keys = []
    if args.config:
        api_keys = load_api_keys_from_file(args.config)
    elif args.keys:
        api_keys = parse_api_keys_from_string(args.keys)
    else:
        print("错误: 必须指定 --config 或 --keys 参数")
        sys.exit(1)
    
    if not api_keys:
        print("错误: 没有找到有效的API keys")
        sys.exit(1)
    
    # 执行检查
    checker = OpenAIModelChecker(timeout=args.timeout)
    results = await checker.batch_check(api_keys, args.model)
    
    # 输出结果
    print_results(results)

    # 输出可用的API keys
    print_available_keys(results, api_keys)

    # 保存到文件
    if args.output:
        save_results_to_json(results, args.output)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n用户中断操作")
        sys.exit(0)
    except Exception as e:
        logger.error(f"程序执行失败: {str(e)}")
        sys.exit(1)
