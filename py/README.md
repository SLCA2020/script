# OpenAI API Key 批量模型可用性检查工具

这个工具可以批量检查多个OpenAI API key对指定模型的可用性，帮助您快速验证API key的有效性和模型访问权限。

## 功能特性

- 🚀 **异步批量检查**: 支持同时检查多个API key，提高检查效率
- 📝 **多种输入方式**: 支持从配置文件读取或直接传入API keys
- 🎯 **指定模型检查**: 可以检查任意OpenAI模型的可用性
- 📊 **详细结果输出**: 显示每个API key的状态、响应时间和错误信息
- 💾 **结果导出**: 支持将检查结果导出为JSON格式
- 🔒 **安全显示**: API key在输出中会被部分隐藏，保护隐私

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. 从配置文件读取API keys

首先创建一个包含API keys的文本文件（参考 `api_keys_example.txt`）：

```bash
# 检查 gpt-4 模型
python openai_model_checker.py --model gpt-4 --config api_keys.txt

# 检查 gpt-3.5-turbo 模型
python openai_model_checker.py --model gpt-3.5-turbo --config api_keys.txt
```

### 2. 直接传入API keys

```bash
# 使用逗号分隔的API keys
python openai_model_checker.py --model gpt-4 --keys "sk-key1,sk-key2,sk-key3"
```

### 3. 保存结果到文件

```bash
# 将检查结果保存为JSON文件
python openai_model_checker.py --model gpt-4 --config api_keys.txt --output results.json
```

### 4. 设置超时时间

```bash
# 设置60秒超时
python openai_model_checker.py --model gpt-4 --config api_keys.txt --timeout 60
```

## 参数说明

- `--model, -m`: 要检查的模型名称（必需）
  - 常用模型: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`, `gpt-4o`, `gpt-4o-mini`
- `--config, -c`: 包含API keys的配置文件路径
- `--keys, -k`: 逗号分隔的API keys字符串
- `--output, -o`: 输出结果到JSON文件的路径（可选）
- `--timeout, -t`: 请求超时时间（秒），默认30秒

## 配置文件格式

API keys配置文件格式很简单，每行一个API key，以 `#` 开头的行为注释：

```
# 这是注释行
sk-1234567890abcdef1234567890abcdef1234567890abcdef12
sk-abcdef1234567890abcdef1234567890abcdef1234567890ab
sk-fedcba0987654321fedcba0987654321fedcba0987654321fe
```

## 输出示例

```
================================================================================
OpenAI API Key 模型可用性检查结果
================================================================================
总计: 3 个API key, 可用: 2 个, 不可用: 1 个
--------------------------------------------------------------------------------
 1. sk-1234...ef12 | gpt-4 | ✓ 可用 (1.23s)

 2. sk-abcd...90ab | gpt-4 | ✓ 可用 (0.98s)

 3. sk-fedc...21fe | gpt-4 | ✗ 不可用
     错误: HTTP 401: Invalid API key provided
```

## 注意事项

1. **API key安全**: 请妥善保管您的API keys，不要将包含真实API keys的文件提交到版本控制系统
2. **速率限制**: OpenAI有API调用速率限制，批量检查时请注意不要超过限制
3. **网络环境**: 确保网络环境可以正常访问OpenAI API
4. **模型权限**: 某些模型可能需要特定的访问权限或付费计划

## 常见问题

**Q: 为什么某个API key显示不可用？**
A: 可能的原因包括：
- API key无效或已过期
- 账户余额不足
- 没有访问指定模型的权限
- 网络连接问题

**Q: 如何获取OpenAI API key？**
A: 访问 [OpenAI Platform](https://platform.openai.com/api-keys) 创建API key

**Q: 支持哪些模型？**
A: 支持所有OpenAI提供的模型，包括GPT-4、GPT-3.5-turbo等
