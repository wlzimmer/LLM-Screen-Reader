// ai-client.js
class AIClient {
  constructor(apiKey, baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async queryWithContext(query, treeContext) {
    const systemPrompt = `
You are an AI assistant that analyzes web pages using structured tree data. 
You have access to the DOM tree structure with hierarchical relationships.
Use this context to provide accurate and relevant responses about the webpage content.

Tree Context:
${JSON.stringify(treeContext, null, 2)}
`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async analyzePageStructure(pageInfo) {
    const prompt = `
Analyze this webpage structure and provide insights:
- Main content areas
- Navigation structure
- Interactive elements
- Information architecture

Page Info: ${JSON.stringify(pageInfo, null, 2)}
`;

    return this.queryWithContext(prompt, pageInfo);
  }

  async findActionableElements(query, elements) {
    const prompt = `
Based on the user query: "${query}"
Find and recommend the most relevant actionable elements from the page.
Provide step-by-step instructions if applicable.

Available Elements: ${JSON.stringify(elements, null, 2)}
`;

    return this.queryWithContext(prompt, { query, elements });
  }
}

// Export for use in popup
window.AIClient = AIClient;
// ai-client.js
class AIClient {
  constructor(apiKey, baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async queryWithContext(query, treeContext) {
    const systemPrompt = `
You are an AI assistant that analyzes web pages using structured tree data. 
You have access to the DOM tree structure with hierarchical relationships.
Use this context to provide accurate and relevant responses about the webpage content.

Tree Context:
${JSON.stringify(treeContext, null, 2)}
`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async analyzePageStructure(pageInfo) {
    const prompt = `
Analyze this webpage structure and provide insights:
- Main content areas
- Navigation structure
- Interactive elements
- Information architecture

Page Info: ${JSON.stringify(pageInfo, null, 2)}
`;

    return this.queryWithContext(prompt, pageInfo);
  }

  async findActionableElements(query, elements) {
    const prompt = `
Based on the user query: "${query}"
Find and recommend the most relevant actionable elements from the page.
Provide step-by-step instructions if applicable.

Available Elements: ${JSON.stringify(elements, null, 2)}
`;

    return this.queryWithContext(prompt, { query, elements });
  }
}

// Export for use in popup
window.AIClient = AIClient;
