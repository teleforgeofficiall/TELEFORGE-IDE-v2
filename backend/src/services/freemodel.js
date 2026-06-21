import { config } from '../config.js';

export const AVAILABLE_MODELS = {
  'claude-opus-4-7': {
    name: 'Claude Opus 4.7',
    provider: 'anthropic',
    endpoint: `${config.freemodel.anthropicBaseUrl}/messages`,
    inputPrice: 5.00,
    outputPrice: 25.00,
    context: '1M',
    paidOnly: false,
  },
  'claude-opus-4-6': {
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    endpoint: `${config.freemodel.anthropicBaseUrl}/messages`,
    inputPrice: 5.00,
    outputPrice: 25.00,
    context: '200K',
    paidOnly: false,
  },
  'claude-sonnet-4-6': {
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    endpoint: `${config.freemodel.anthropicBaseUrl}/messages`,
    inputPrice: 3.00,
    outputPrice: 15.00,
    context: '1M',
    paidOnly: false,
  },
  'claude-haiku-4-5-20251001': {
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    endpoint: `${config.freemodel.anthropicBaseUrl}/messages`,
    inputPrice: 1.00,
    outputPrice: 5.00,
    context: '200K',
    paidOnly: false,
  },
  'claude-fable-5': {
    name: 'Claude Fable 5',
    provider: 'anthropic',
    endpoint: `${config.freemodel.anthropicBaseUrl}/messages`,
    inputPrice: 10.00,
    outputPrice: 50.00,
    context: '1M',
    paidOnly: true,
  },
  'gpt-5.5': {
    name: 'GPT-5.5',
    provider: 'openai',
    endpoint: `${config.freemodel.openaiBaseUrl}/chat/completions`,
    inputPrice: 5.00,
    outputPrice: 30.00,
    context: '1M+',
    paidOnly: true,
  },
  'gpt-5.4': {
    name: 'GPT-5.4',
    provider: 'openai',
    endpoint: `${config.freemodel.openaiBaseUrl}/chat/completions`,
    inputPrice: 2.50,
    outputPrice: 15.00,
    context: '270K',
    paidOnly: false,
  },
  'gpt-5.4-mini': {
    name: 'GPT-5.4 Mini',
    provider: 'openai',
    endpoint: `${config.freemodel.openaiBaseUrl}/chat/completions`,
    inputPrice: 0.75,
    outputPrice: 4.50,
    context: '128K',
    paidOnly: false,
  },
  'gpt-5.3-codex': {
    name: 'GPT-5.3 Codex',
    provider: 'openai',
    endpoint: `${config.freemodel.openaiBaseUrl}/chat/completions`,
    inputPrice: 1.75,
    outputPrice: 14.00,
    context: '1M',
    paidOnly: false,
  },
};

import { execSync } from 'child_process';

let claudeBusy = false;
const claudeQueue = [];

export async function callFreeModel(modelId, messages, apiKey, useCLI = false) {
  const model = AVAILABLE_MODELS[modelId];
  if (!model) {
    throw { status: 400, code: 'invalid_model', message: `Model '${modelId}' does not exist` };
  }

  if (useCLI) {
    return await callClaudeCLI(messages);
  }

  if (!apiKey) {
    throw { status: 401, code: 'invalid_api_key', message: 'No API key provided. Please enter your FreeModel API key in settings.' };
  }

  if (model.provider === 'anthropic') {
    return await callAnthropicEndpoint(model, messages, apiKey);
  } else {
    return await callOpenAIEndpoint(model, messages, apiKey);
  }
}

async function callClaudeCLI(messages) {
  const lastMsg = messages[messages.length - 1];
  const prompt = lastMsg.content;

  return new Promise((resolve, reject) => {
    const tryExecute = async () => {
      if (claudeBusy) {
        claudeQueue.push(tryExecute);
        return;
      }

      claudeBusy = true;
      try {
        const output = execSync(`echo ${JSON.stringify(prompt)} | claude --print 2>&1`, {
          timeout: 60000,
          maxBuffer: 10 * 1024 * 1024,
          shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
        });

        const content = output.toString().trim();

        claudeBusy = false;
        processQueue();

        resolve({
          content,
          tokens: { input: 0, output: 0 },
          model: 'claude (CLI mode)',
        });
      } catch (err) {
        claudeBusy = false;
        processQueue();

        const errMsg = err.stderr?.toString() || err.message || 'CLI execution failed';
        reject({
          status: 500,
          code: 'cli_error',
          message: errMsg,
        });
      }
    };

    tryExecute();
  });
}

function processQueue() {
  if (claudeQueue.length > 0) {
    const next = claudeQueue.shift();
    setTimeout(next, 100);
  }
}

async function callAnthropicEndpoint(model, messages, apiKey) {
  const lastMsg = messages[messages.length - 1];

  const body = {
    model: modelIdToAnthropic(model.name),
    max_tokens: 4096,
    messages: [{ role: 'user', content: lastMsg.content }],
  };

  const response = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      code: data.error?.type || 'api_error',
      message: data.error?.message || JSON.stringify(data),
    };
  }

  return {
    content: data.content?.[0]?.text || '',
    tokens: {
      input: data.usage?.input_tokens || 0,
      output: data.usage?.output_tokens || 0,
    },
    model: model.name,
  };
}

async function callOpenAIEndpoint(model, messages, apiKey) {
  const lastMsg = messages[messages.length - 1];
  const modelId = modelIdToOpenAI(model.name);

  const body = {
    model: modelId,
    max_tokens: 4096,
    messages: [{ role: 'user', content: lastMsg.content }],
  };

  const response = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      code: data.error?.code || 'api_error',
      message: data.error?.message || JSON.stringify(data),
    };
  }

  return {
    content: data.choices?.[0]?.message?.content || '',
    tokens: {
      input: data.usage?.prompt_tokens || 0,
      output: data.usage?.completion_tokens || 0,
    },
    model: model.name,
  };
}

function modelIdToAnthropic(name) {
  const map = {
    'Claude Opus 4.7': 'claude-opus-4-7',
    'Claude Opus 4.6': 'claude-opus-4-6',
    'Claude Sonnet 4.6': 'claude-sonnet-4-6',
    'Claude Haiku 4.5': 'claude-haiku-4-5-20251001',
    'Claude Fable 5': 'claude-fable-5',
  };
  return map[name] || 'claude-sonnet-4-6';
}

function modelIdToOpenAI(name) {
  const map = {
    'GPT-5.5': 'gpt-5.5',
    'GPT-5.4': 'gpt-5.4',
    'GPT-5.4 Mini': 'gpt-5.4-mini',
    'GPT-5.3 Codex': 'gpt-5.3-codex',
  };
  return map[name] || 'gpt-5.4-mini';
}

export function getAvailableModels() {
  return Object.entries(AVAILABLE_MODELS).map(([id, m]) => ({
    id,
    name: m.name,
    provider: m.provider,
    inputPrice: m.inputPrice,
    outputPrice: m.outputPrice,
    context: m.context,
    paidOnly: m.paidOnly,
  }));
}
